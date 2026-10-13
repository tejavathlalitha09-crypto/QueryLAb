export type ExecutionStatus = "idle" | "running" | "success" | "error" | "cancelled";

export interface QueryColumn {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  truncated: boolean;
}

export interface ExecutionResponse {
  ok: boolean;
  status: "success" | "error";
  result?: QueryResult;
  error?: { message: string; line?: number; hint?: string };
  engine: "postgres" | "demo";
}

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
  dirty: boolean;
}

export interface SavedQuery {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  sql_text: string;
  dialect: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  user_id?: string;
  query_text: string;
  status: "success" | "error";
  executionTimeMs: number;
  rows_returned: number;
  error_message: string | null;
  created_at: string;
}
