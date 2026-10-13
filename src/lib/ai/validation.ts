import { z } from "zod";
import type { AiAction } from "@/types/ai";

const actions: AiAction[] = [
  "generate",
  "explain",
  "optimize",
  "debug",
  "convert",
  "practice",
  "summarize",
];

export const aiSqlRequestSchema = z.object({
  action: z.enum(actions as [AiAction, ...AiAction[]]),
  prompt: z.string().min(1, "Prompt required").max(8000),
  dialect: z.string().max(32).optional().default("PostgreSQL"),
  schema: z.string().max(12000).optional().default(""),
  sql: z.string().max(20000).optional().default(""),
  error: z.string().max(5000).optional().default(""),
  targetDialect: z.string().max(32).optional(),
});

export type AiSqlRequestInput = z.infer<typeof aiSqlRequestSchema>;
