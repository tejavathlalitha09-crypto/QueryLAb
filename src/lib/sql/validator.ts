import { parse } from "pgsql-ast-parser";

export interface ValidationResult {
  ok: boolean;
  error?: string;
  statements?: number;
}

const WRITE_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "create",
  "truncate",
  "grant",
  "revoke",
  "copy",
  "vacuum",
  "reindex",
  "cluster",
  "comment",
  "security",
  "owner",
  "privileges",
];

function stripLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/\$\$[\s\S]*?\$\$/g, "$$$$");
}

function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Detect non-SELECT statement types via the PostgreSQL AST parser (not regex alone). */
export function validateReadOnly(sql: string): ValidationResult {
  const withoutComments = stripComments(sql).trim();
  if (!withoutComments) return { ok: false, error: "Query is empty." };
  const cleaned = stripLiterals(withoutComments).replace(/;+\s*$/, "");
  if (/;\s*\S/.test(cleaned)) {
    return {
      ok: false,
      error: "Multiple statements are not allowed. Execute one SELECT at a time.",
    };
  }
  // Fast keyword pre-check on statement start (comments/string-safe enough post-strip)
  const first = cleaned.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (WRITE_KEYWORDS.includes(first)) {
    return {
      ok: false,
      error: `Only read-only SELECT queries are allowed in the playground. "${first.toUpperCase()}" is not permitted.`,
    };
  }
  if (first !== "select" && first !== "with" && first !== "values" && first !== "table" && first !== "show" && first !== "explain") {
    return {
      ok: false,
      error: `Only read-only SELECT queries are allowed. Statement starts with "${first || "?"}".`,
    };
  }
  try {
    const ast = parse(withoutComments.replace(/;+\s*$/, ""));
    const stmts = Array.isArray(ast) ? ast : [ast];
    if (stmts.length !== 1) {
      return { ok: false, error: "Execute exactly one statement at a time." };
    }
    const type = (stmts[0] as { type?: string }).type ?? "";
    const readOnlyTypes = new Set([
      "select",
      "union",
      "union all",
      "with",
      "values",
      "table",
      "show",
      "empty",
    ]);
    // pgsql-ast-parser select type is "select"
    if (!readOnlyTypes.has(type)) {
      return {
        ok: false,
        error: `Statement type "${type}" is not allowed. Only SELECT queries may run.`,
      };
    }
    return { ok: true, statements: 1 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse error";
    // If it parses as nothing meaningful, still reject writes via keyword scan
    const lowered = ` ${cleaned.toLowerCase()} `;
    for (const kw of WRITE_KEYWORDS) {
      const re = new RegExp(`(^|[^a-z_])${kw}([^a-z_]|$)`);
      if (re.test(lowered)) {
        return {
          ok: false,
          error: `Write operation "${kw.toUpperCase()}" is not permitted in read-only mode.`,
        };
      }
    }
    return { ok: false, error: `SQL parse error: ${msg}` };
  }
}
