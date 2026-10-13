import { getDemoTables } from "./demo-data";

export interface DemoExecResult {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
}

// Minimal SELECT interpreter over the seeded demo tables.
// Supports: SELECT [DISTINCT] cols|*|aggr, FROM t [alias] [, ...],
// [INNER|LEFT JOIN ... ON ...], WHERE (AND/OR/=,!=,<>,>,<,>=,<=,LIKE,IN,BETWEEN,IS NULL),
// GROUP BY, aggregations (COUNT/SUM/AVG/MIN/MAX), HAVING, ORDER BY, LIMIT/OFFSET, aliases, simple subselects in FROM.
type Row = Record<string, unknown>;

function splitTop(sql: string, keyword: RegExp): [string, string] | null {
  let depth = 0;
  let inStr = false;
  let q = "";
  const upper = sql.toUpperCase();
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" && sql[i - 1] !== "\\") { inStr = !inStr; }
    if (!inStr) {
      if (c === "(") depth++;
      if (c === ")") depth--;
    }
    if (!inStr && depth === 0) {
      const rest = sql.slice(i);
      const m = rest.match(keyword);
      if (m && m.index === 0) {
        return [sql.slice(0, i), rest.slice(m[0].length)];
      }
    }
    q += c;
    void q; void upper;
  }
  return null;
}

function splitList(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "", inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") inStr = !inStr;
    if (!inStr) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseValue(raw: string, row: Row): unknown {
  const t = raw.trim();
  if (/^NULL$/i.test(t)) return null;
  const str = t.match(/^'(.*)'$/s);
  if (str) return str[1].replace(/''/g, "'");
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
  if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
  const now = t.match(/^CURRENT_DATE$/i);
  if (now) return new Date().toISOString().slice(0, 10);
  // column ref
  if (/^[A-Za-z_][\w.]*$/.test(t)) {
    if (t in row) return row[t];
    const hit = Object.keys(row).find((k) => k.toLowerCase() === t.toLowerCase() || k.split(".").pop()?.toLowerCase() === t.split(".").pop()!.toLowerCase());
    if (hit) return row[hit];
    return undefined;
  }
  return t;
}

function likeMatch(v: string, pattern: string): boolean {
  const re = new RegExp("^" + pattern.replace(/[%_]/g, (m) => (m === "%" ? ".*" : ".")) + "$", "i");
  return re.test(v);
}

function evalCond(cond: string, row: Row): boolean {
  let t = cond.trim().replace(/^\(+/, "").replace(/\)+$/, "").trim();

  // Normalize: collapse multiple spaces, handle case
  t = t.replace(/\s+/g, " ");

  // Handle AND/OR splitting first
  const orParts = splitByLogic(t, "OR");
  if (orParts.length > 1) return orParts.some((p) => evalCond(p, row));
  const andParts = splitByLogic(t, "AND");
  if (andParts.length > 1) return andParts.every((p) => evalCond(p, row));

  // IS NULL / IS NOT NULL
  if (t.toUpperCase().indexOf("IS NOT NULL") > -1) {
    const after = t.replace(/IS\s+NOT\s+NULL/i, "").trim();
    return parseValue(after, row) !== null && parseValue(after, row) !== undefined;
  }
  if (t.toUpperCase().indexOf("IS NULL") > -1) {
    const after = t.replace(/IS\s+NULL/i, "").trim();
    const v = parseValue(after, row);
    return v === null || v === undefined;
  }

  // LIKE
  if (t.toUpperCase().indexOf("LIKE") > -1) {
    // Extract the pattern: column LIKE 'pattern' or 'pattern' LIKE column
    const likeMatch = t.match(/(.+?)\s+LIKE\s+(.+)/i);
    if (likeMatch) {
      const left = String(parseValue(likeMatch[1].trim(), row) ?? "");
      const right = String(parseValue(likeMatch[2].trim(), row) ?? "");
      return (new RegExp("^" + right.replace(/[%_]/g, (m) => (m === "%" ? ".*" : ".")) + "$", "i").test(left));
    }
  }

  // IN / NOT IN
  if (t.toUpperCase().indexOf(" IN ") > -1) {
    const inner = t.slice(t.indexOf(" IN ") + 4).trim(); // after " IN "
    // Remove surrounding parens
    let innerClean = inner;
    if (inner.startsWith("(") && inner.endsWith(")")) {
      innerClean = inner.slice(1, -1).trim();
    }
    const values = innerClean.split(",").map((v) => parseValue(v.trim(), row));
    const searchValue = values[0];
    // The first value before IN is the search column
    const beforeIn = t.slice(0, t.indexOf(" IN ")).trim();
    const searchCol = parseValue(beforeIn, row);
    return values.some((v) => looseEq(searchCol, v));
  }

  if (t.toUpperCase().indexOf(" NOT IN ") > -1) {
    const inner = t.slice(t.indexOf(" NOT IN ") + 8).trim();
    let innerClean = inner;
    if (inner.startsWith("(") && inner.endsWith(")")) {
      innerClean = inner.slice(1, -1).trim();
    }
    const values = innerClean.split(",").map((v) => parseValue(v.trim(), row));
    const searchValue = values[0];
    const beforeIn = t.slice(0, t.indexOf(" NOT IN ")).trim();
    const searchCol = parseValue(beforeIn, row);
    return !values.some((v) => looseEq(searchCol, v));
  }

  // BETWEEN
  if (t.toUpperCase().indexOf("BETWEEN") > -1) {
    const before = t.slice(0, t.indexOf("BETWEEN")).trim();
    const after = t.slice(t.indexOf("BETWEEN") + 7).trim();
    // after should be "value1 AND value2"
    const andIdx = after.indexOf("AND");
    if (andIdx > -1) {
      const a = parseValue(after.slice(0, andIdx).trim(), row);
      const b = parseValue(after.slice(andIdx + 3).trim(), row);
      const v = parseValue(before, row);
      return cmp(v, a) >= 0 && cmp(v, b) <= 0;
    }
  }

  // Simple comparison: =, <>, >, <, >=, <=
  const cmpMatch = t.match(/^(.+?)\s*(<>|!=|>=|<=|=|>|<)\s*(.+)$/i);
  if (cmpMatch) {
    const l = parseValue(cmpMatch[1].trim(), row);
    const r = parseValue(cmpMatch[3].trim(), row);
    switch (cmpMatch[2]) {
      case "=": return looseEq(l, r);
      case "<>": case "!=": return !looseEq(l, r);
      case ">": return cmp(l, r) > 0;
      case "<": return cmp(l, r) < 0;
      case ">=": return cmp(l, r) >= 0;
      case "<=": return cmp(l, r) <= 0;
    }
  }

  throw new Error(`Unsupported WHERE condition: "${cond}"`);
}

function splitByLogic(s: string, kw: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "", inStr = false;
  const K = kw.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") inStr = !inStr;
    if (!inStr) {
      if (c === "(") depth++;
      if (c === ")") depth--;
    }
    if (!inStr && depth === 0) {
      const ahead = s.slice(i).match(new RegExp(`^\\s*${K}\\s+`, "i"));
      const behindOk = cur === "" || /\s$/.test(cur) || /\)$/.test(cur);
      if (ahead && behindOk) {
        out.push(cur.trim()); cur = "";
        i += ahead[0].length - 1; continue;
      }
    }
    cur += c;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

function looseEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}
function cmp(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  const na = Number(a), nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && a !== "" && b !== "") return na - nb;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

interface SelectSpec {
  distinct: boolean;
  cols: { expr: string; alias: string; aggr?: { fn: string; arg: string } }[];
  from: { table: string; alias: string; sub?: SelectSpec }[];
  joins: { table: string; alias: string; on: string; left: boolean; sub?: SelectSpec }[];
  where?: string;
  groupBy: string[];
  having?: string;
  orderBy: { expr: string; desc: boolean }[];
  limit?: number;
  offset?: number;
}

function parseFromSegment(seg: string, tables: Record<string, { rows: Row[] }>): { table: string; alias: string; sub?: SelectSpec } {
  const t = seg.trim();
  if (/^\(/.test(t)) {
    const close = t.lastIndexOf(")");
    const inner = t.slice(1, close);
    const rest = t.slice(close + 1).trim().replace(/^AS\s+/i, "");
    return { table: "__sub__", alias: rest.split(/\s+/)[0] || "sub", sub: parseSelect(inner) };
  }
  const parts = t.split(/\s+/);
  const tn = parts[0].replace(/^"|"$/g, "");
  const alias = (parts[1] && !/^on$/i.test(parts[1]) ? parts[1].replace(/^AS\s+/i, "") : tn).replace(/^AS\s+/i, "");
  void tables;
  return { table: tn.toLowerCase(), alias: alias.replace(/[";]/g, "") || tn };
}

function parseSelect(sql: string): SelectSpec {
  let s = sql.trim().replace(/;+\s*$/, "");
  const selM = s.match(/^SELECT\s+(DISTINCT\s+)?/i);
  if (!selM) throw new Error("Only SELECT queries are supported by the demo engine.");
  const distinct = Boolean(selM[1]);
  s = s.slice(selM[0].length);
  const fromSplit = splitTop(s, /^\sFROM\s/i);
  if (!fromSplit) throw new Error('Missing FROM clause.');
  const colsRaw = fromSplit[0];
  let rest = fromSplit[1];
  const cols = splitList(colsRaw).map((c) => {
    const am = c.match(/^(.*?)\s+AS\s+("?\w+"?)$/i) || c.match(/^(.*\S)\s+("?\w+"?)$/);
    let expr = c, alias = c;
    if (am && !/^COUNT|SUM|AVG|MIN|MAX/i.test(c) || (am && /\sAS\s/i.test(c))) {
      expr = am[1].trim(); alias = am[2].replace(/"/g, "");
    } else if (am && /\(\*\)|\(.+\)/.test(c)) {
      // function with trailing alias without AS
      const fm = c.match(/^(\w+\s*\(.*\))\s+(\w+)$/);
      if (fm) { expr = fm[1]; alias = fm[2]; }
    }
    const gm = expr.match(/^(\w+)\s*\(\s*(\*|[\w.]+)?\s*\)$/);
    if (gm) {
      const fn = gm[1].toUpperCase();
      if (["COUNT", "SUM", "AVG", "MIN", "MAX"].includes(fn)) {
        return { expr, alias: alias === c ? `${fn.toLowerCase()}` : alias, aggr: { fn, arg: gm[2] ?? "*" } };
      }
    }
    if (alias === c) {
      const dot = expr.split(".").pop()!;
      alias = dot.replace(/["*]/g, "") || expr;
    }
    return { expr, alias };
  });

  // ORDER BY / LIMIT / OFFSET from the tail
  let orderBy: SelectSpec["orderBy"] = [];
  let limit: number | undefined, offset: number | undefined;
  const tail = (r: string): string => {
    let x = r;
    // Match LIMIT — don't use $ anchor since OFFSET may follow
    const lm = x.match(/\sLIMIT\s+(\d+)/i);
    if (lm) { limit = parseInt(lm[1], 10); x = x.slice(lm[0].length); }
    // Match OFFSET — similarly
    const om = x.match(/\sOFFSET\s+(\d+)/i);
    if (om) { offset = parseInt(om[1], 10); x = x.slice(om[0].length); }
    // Then ORDER BY
    const obm = splitTop(x, /^\sORDER\s+BY\s/i);
    if (obm) {
      orderBy = splitList(obm[1]).map((o) => {
        const dm = o.match(/^(.*?)\s+(DESC|ASC)$/i);
        return dm ? { expr: dm[1].trim(), desc: /^DESC$/i.test(dm[2]) } : { expr: o.trim(), desc: false };
      });
      x = obm[0];
    }
    return x;
  };
  rest = tail(rest);

  let having: string | undefined;
  const hv = splitTop(rest, /^\sHAVING\s/i);
  if (hv) { having = hv[1]; rest = hv[0]; }
  let groupBy: string[] = [];
  const gb = splitTop(rest, /^\sGROUP\s+BY\s/i);
  if (gb) { groupBy = splitList(gb[1]); rest = gb[0]; }
  let where: string | undefined;
  const wh = splitTop(rest, /^\sWHERE\s/i);
  if (wh) { where = wh[1]; rest = wh[0]; }

  // FROM + JOINs
  const joinRe = /\s(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|JOIN)\s/i;
  const segments: string[] = [];
  let cur = rest, firstSeg = true;
  const fromSegs: string[] = [];
  // naive top-level split on JOIN keywords
  {
    let depth = 0, inStr = false, buf = "";
    const pushJoin: { kind: string; seg: string }[] = [];
    let i = 0;
    while (i < cur.length) {
      const c = cur[i];
      if (c === "'") inStr = !inStr;
      if (!inStr) { if (c === "(") depth++; if (c === ")") depth--; }
      if (!inStr && depth === 0) {
        const m = cur.slice(i).match(/^\s*(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|JOIN)\s+/i);
        if (m) {
          (firstSeg ? fromSegs : segments).push(buf);
          pushJoin.push({ kind: m[1], seg: "" });
          buf = "";
          i += m[0].length;
          firstSeg = false;
          // capture until next join or end, but ON handled later
          continue;
        }
      }
      buf += c; i++;
    }
    (firstSeg ? fromSegs : segments).push(buf);
    void pushJoin;
  }
  const tableObjs = getDemoTables();
  const rowTables: Record<string, { rows: Row[] }> = Object.fromEntries(
    Object.entries(tableObjs).map(([k, v]) => [k, { rows: v.rows }])
  );
  const fromList = splitList(fromSegs.join(" ")).map((f) => parseFromSegment(f, rowTables));
  const joins = segments.map((seg) => {
    const onSplit = splitTop(seg, /^\sON\s/i);
    if (!onSplit) throw new Error(`JOIN without ON is not supported: "${seg.trim()}"`);
    const left = /^\s*LEFT/i.test(seg) || false;
    // kind word consumed? segments lost kind; detect LEFT from seg start
    const tbl = parseFromSegment(onSplit[0].replace(/^(INNER|LEFT(\s+OUTER)?)\s+JOIN\s+/i, "").trim(), rowTables);
    void left;
    const isLeft = /LEFT/i.test(seg.slice(0, 12)) || false;
    return { table: tbl.table, alias: tbl.alias, sub: tbl.sub, on: onSplit[1], left: isLeft };
  });

  return { distinct, cols, from: fromList, joins, where, groupBy, having, orderBy, limit, offset };
}

function qualify(rows: Row[], alias: string): Row[] {
  return rows.map((r) => {
    const o: Row = { ...r };
    for (const k of Object.keys(r)) o[`${alias}.${k}`] = r[k];
    return o;
  });
}

function execSpec(spec: SelectSpec): DemoExecResult {
  const tables = getDemoTables();
  const getRows = (t: string, sub?: SelectSpec): { rows: Row[]; cols: string[] } => {
    if (sub) {
      const r = execSpec(sub);
      return { rows: r.rows, cols: r.columns.map((c) => c.name) };
    }
    const dt = tables[t] || tables[t.toLowerCase()];
    if (!dt) throw new Error(`Table "${t}" does not exist. Available: ${Object.keys(tables).join(", ")}`);
    return { rows: qualify(dt.rows, t), cols: dt.columns.map((c) => c.name) };
  };

  let combined: Row[] = [];
  for (const f of spec.from) {
    const { rows } = getRows(f.table, f.sub);
    const q = f.sub ? rows : qualify(rows.map((r) => {
      const o: Row = {};
      for (const k of Object.keys(r)) o[k.replace(`${f.table}.`, "")] = r[k];
      return { ...r, ...o };
    }), f.alias);
    combined = combined.length ? combined.flatMap((a) => q.map((b) => ({ ...a, ...b }))) : q;
  }
  for (const j of spec.joins) {
    const { rows } = getRows(j.table, j.sub);
    const q = j.sub ? rows : qualify(rows, j.alias);
    const next: Row[] = [];
    for (const a of combined) {
      let matched = false;
      for (const b of q) {
        const m = { ...a, ...b };
        let ok = true;
        try { ok = evalCond(j.on, m); } catch { ok = false; }
        if (ok) { next.push(m); matched = true; }
      }
      if (!matched && j.left) next.push({ ...a });
    }
    combined = next;
  }

  if (spec.where) {
    combined = combined.filter((r) => {
      try { return evalCond(spec.where!, r); } catch (e) { throw e; }
    });
  }

  const hasAggr = spec.cols.some((c) => c.aggr);
  let outRows: Row[];
  let outCols: { name: string; type: string }[];

  const evalExpr = (expr: string, r: Row): unknown => {
    const t = expr.trim();
    if (t === "*") return "[row]";
    // arithmetic: a * b, a - b etc (two operands)
    const am = t.match(/^(.+?)\s*(\*|\/|\+|\-)\s*(.+)$/);
    if (am && !/^COUNT|SUM|AVG|MIN|MAX/i.test(t)) {
      const l = Number(evalExpr(am[1], r)), rr = Number(evalExpr(am[3], r));
      if (!Number.isNaN(l) && !Number.isNaN(rr)) {
        switch (am[2]) {
          case "*": return l * rr;
          case "/": return rr === 0 ? null : l / rr;
          case "+": return l + rr;
          case "-": return l - rr;
        }
      }
    }
    // EXTRACT / DATE_TRUNC / CAST basics
    const cast = t.match(/^CAST\s*\((.+)\s+AS\s+\w+\)$/i);
    if (cast) return evalExpr(cast[1], r);
    const dt = t.match(/^(DATE_TRUNC|EXTRACT)\s*\(/i);
    if (dt) {
      const inner = t.slice(t.indexOf("(") + 1, t.lastIndexOf(")"));
      const parts = splitList(inner);
      const colExpr = parts.length > 1 ? parts[1] : parts[0];
      return evalExpr(colExpr, r);
    }
    return parseValue(t, r);
  };

  if (hasAggr || spec.groupBy.length) {
    const groups = new Map<string, Row[]>();
    for (const r of combined) {
      const key = spec.groupBy.length ? JSON.stringify(spec.groupBy.map((g) => evalExpr(g, r))) : "__all__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    outRows = [];
    for (const [, g] of groups) {
      const first = g[0];
      const o: Row = {};
      for (const c of spec.cols) {
        if (c.aggr) {
          const { fn, arg } = c.aggr;
          if (fn === "COUNT" && arg === "*") o[c.alias] = g.length;
          else {
            const vals = g.map((r) => evalExpr(arg, r)).filter((v) => v !== null && v !== undefined);
            if (fn === "COUNT") o[c.alias] = vals.length;
            else if (!vals.length) o[c.alias] = null;
            else if (fn === "SUM") o[c.alias] = vals.reduce((a, b) => Number(a) + Number(b), 0);
            else if (fn === "AVG") o[c.alias] = Math.round((vals.reduce((a, b) => Number(a) + Number(b), 0) / vals.length) * 100) / 100;
            else if (fn === "MIN") o[c.alias] = vals.reduce((a, b) => (cmp(a as number, b as number) <= 0 ? a : b));
            else if (fn === "MAX") o[c.alias] = vals.reduce((a, b) => (cmp(a as number, b as number) >= 0 ? a : b));
          }
        } else o[c.alias] = evalExpr(c.expr, first);
      }
      outRows.push(o);
    }
    if (spec.having) outRows = outRows.filter((r) => { try { return evalCond(spec.having!, r); } catch { return true; } });
    outCols = spec.cols.map((c) => ({ name: c.alias, type: c.aggr ? "numeric" : "text" }));
  } else if (spec.cols.length === 1 && spec.cols[0].expr.trim() === "*") {
    // expand *: use first table's plain columns
    const sample = combined[0] ?? {};
    const names = Object.keys(sample).filter((k) => !k.includes("."));
    outCols = names.map((n) => ({ name: n, type: typeof sample[n] === "number" ? "integer" : "text" }));
    // If no rows returned, default to table column definitions
    if (outCols.length === 0) {
      const dt = tables[spec.from[0].table] || tables[spec.from[0].table.toLowerCase()];
      if (dt) {
        outCols = dt.columns.map((c) => ({ name: c.name, type: c.type }));
      }
    }
    outRows = combined.map((r) => Object.fromEntries(names.map((n) => [n, r[n] ?? r[Object.keys(r).find((k) => k.endsWith(`.${n}`)) ?? n]])));
  } else {
    outCols = spec.cols.map((c) => ({ name: c.alias, type: "text" }));
    outRows = combined.map((r) => {
      const o: Row = {};
      for (const c of spec.cols) {
        if (c.expr.trim() === "*") { Object.assign(o, r); continue; }
        const star = c.expr.match(/^([\w]+)\.\*$/);
        if (star) {
          for (const k of Object.keys(r)) {
            if (k.startsWith(`${star[1]}.`) || (!k.includes(".") && spec.from.some((f) => f.alias === star[1]))) o[k.includes(".") ? k.split(".")[1] : k] = r[k];
          }
          continue;
        }
        o[c.alias] = evalExpr(c.expr, r);
      }
      return o;
    });
    // infer numeric types
    outCols = outCols.map((col) => {
      const vals = outRows.map((r) => r[col.name]).filter((v) => v !== null && v !== undefined);
      return { ...col, type: vals.length && vals.every((v) => typeof v === "number") ? "integer" : "text" };
    });
  }

  if (spec.distinct) {
    const seen = new Set<string>();
    outRows = outRows.filter((r) => {
      const k = JSON.stringify(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  if (spec.orderBy.length) {
    outRows = [...outRows].sort((a, b) => {
      for (const o of spec.orderBy) {
        const key = Object.keys(a).find((k) => k.toLowerCase() === o.expr.toLowerCase() || k.split(".").pop()?.toLowerCase() === o.expr.split(".").pop()!.toLowerCase()) ?? o.expr;
        const d = cmp(a[key], b[key]);
        if (d !== 0) return o.desc ? -d : d;
      }
      return 0;
    });
  }
  if (spec.offset) outRows = outRows.slice(spec.offset);
  if (spec.limit !== undefined) outRows = outRows.slice(0, spec.limit);
  return { columns: outCols, rows: outRows };
}

export function executeDemo(sql: string, maxRows = 500): DemoExecResult {
  const spec = parseSelect(sql);
  if (spec.limit === undefined || spec.limit > maxRows) spec.limit = maxRows;
  return execSpec(spec);
}
