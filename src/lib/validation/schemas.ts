import { z } from "zod";

export const executeRequestSchema = z.object({
  sql: z.string().min(1, "SQL is required").max(20000, "Query too large (max 20k chars)"),
  limit: z.number().int().min(1).max(5000).optional().default(500),
  timeoutMs: z.number().int().min(500).max(30000).optional().default(10000),
});

export type ExecuteRequest = z.infer<typeof executeRequestSchema>;

export const historyWriteSchema = z.object({
  query_text: z.string().min(1).max(20000),
  status: z.enum(["success", "error"]),
  executionTimeMs: z.number().min(0).max(3600000),
  rows_returned: z.number().int().min(0),
  error_message: z.string().max(5000).nullable().optional(),
});

export const savedQuerySchema = z.object({
  title: z.string().min(1, "Title required").max(120),
  description: z.string().max(1000).optional().default(""),
  sql_text: z.string().min(1, "SQL required").max(50000),
  dialect: z.string().max(32).optional().default("PostgreSQL"),
  tags: z.array(z.string().max(32)).max(20).optional().default([]),
  is_favorite: z.boolean().optional().default(false),
});
