export type AiAction =
  | "generate"
  | "explain"
  | "optimize"
  | "debug"
  | "convert"
  | "practice"
  | "summarize";

export interface AiSqlRequest {
  action: AiAction;
  prompt: string;
  dialect?: string;
  schema?: string;
  sql?: string;
  error?: string;
  targetDialect?: string;
}

export interface AiSqlResponse {
  ok: boolean;
  action: AiAction;
  sql?: string;
  explanation?: string;
  assumptions?: string[];
  performanceConcerns?: string[];
  improvements?: string[];
  safetyWarning?: string;
  model: string;
  demo?: boolean;
  error?: string;
}
