import { Pool } from "pg";
import { validateReadOnly } from "./validator";
import { executeDemo } from "./demo-engine";

export interface ExecResult {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  truncated: boolean;
  engine: "postgres" | "demo";
}

let pool: Pool | null = null;

function getPool(): Pool | null {
  const url =
    process.env.SQL_EXECUTION_READONLY_DATABASE_URL ||
    process.env.SQL_EXECUTION_DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 3,
      statement_timeout: 10000,
      query_timeout: 12000,
    });
  }
  return pool;
}

export function executionEngine(): "postgres" | "demo" {
  return getPool() ? "postgres" : "demo";
}

function pgTypeName(oid: number): string {
  const map: Record<number, string> = {
    16: "boolean", 20: "bigint", 21: "smallint", 23: "integer",
    25: "text", 1042: "char", 1043: "varchar", 1700: "numeric",
    700: "real", 701: "double", 1082: "date", 1114: "timestamp",
    1184: "timestamptz", 114: "json", 3802: "jsonb", 2950: "uuid",
  };
  return map[oid] ?? "text";
}

export async function executeSql(
  sql: string,
  limit = 500,
  timeoutMs = 10000
): Promise<ExecResult> {
  const v = validateReadOnly(sql);
  if (!v.ok) throw new Error(v.error);
  const started = Date.now();
  const engine = executionEngine();
  if (engine === "demo") {
    const r = executeDemo(sql, Math.min(limit, 5000));
    return {
      ...r,
      rowCount: r.rows.length,
      executionTimeMs: Date.now() - started,
      truncated: r.rows.length >= Math.min(limit, 5000),
      engine,
    };
  }
  const p = getPool()!;
  const client = await p.connect();
  try {
    await client.query(`SET LOCAL statement_timeout = ${Math.min(timeoutMs, 30000)}`);
    const res = await client.query(sql);
    const elapsed = Date.now() - started;
    const rows = (res.rows as Record<string, unknown>[]).slice(0, limit);
    return {
      columns: res.fields.map((f) => ({ name: f.name, type: pgTypeName(f.dataTypeID) })),
      rows,
      rowCount: res.rowCount ?? rows.length,
      executionTimeMs: elapsed,
      truncated: (res.rowCount ?? 0) > limit,
      engine,
    };
  } finally {
    client.release();
  }
}
