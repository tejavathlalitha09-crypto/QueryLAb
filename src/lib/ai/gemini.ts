import { GoogleGenAI } from "@google/genai";
import type { AiAction } from "@/types/ai";

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function systemPrompt(action: AiAction, dialect: string, schema: string): string {
  const base = `You are QueryLab, an expert SQL assistant. The SQL dialect is ${dialect}.`;
  const ctx = schema
    ? ` Available schema (tables and columns): ${schema}. Only reference tables/columns from this schema unless the user explicitly asks otherwise.`
    : "";
  switch (action) {
    case "generate":
      return `${base} Generate a correct, read-only SELECT query for the user's request.${ctx} Respond ONLY with valid JSON: {"sql": "...", "explanation": "...", "assumptions": ["..."], "performanceConcerns": ["..."], "improvements": ["..."]}. No markdown fences.`;
    case "explain":
      return `${base} Explain the provided SQL in simple language for a student.${ctx} Respond ONLY with valid JSON: {"explanation": "...", "assumptions": ["..."], "improvements": ["..."]}. No markdown fences.`;
    case "optimize":
      return `${base} Analyze the provided SQL for performance problems and return an optimized version.${ctx} Respond ONLY with valid JSON: {"sql": "...", "explanation": "...", "performanceConcerns": ["..."], "improvements": ["..."]}. No markdown fences.`;
    case "debug":
      return `${base} Debug the provided SQL and its error message. Return a fixed query.${ctx} Respond ONLY with valid JSON: {"sql": "...", "explanation": "...", "assumptions": ["..."], "improvements": ["..."]}. No markdown fences.`;
    case "convert":
      return `${base} Convert the provided SQL to the target dialect. Respond ONLY with valid JSON: {"sql": "...", "explanation": "...", "assumptions": ["..."]}. No markdown fences.`;
    case "practice":
      return `${base} Create 3 SQL practice exercises for the given topic/schema with solutions.${ctx} Respond ONLY with valid JSON: {"explanation": "...", "sql": "...", "assumptions": ["..."]}. No markdown fences.`;
    case "summarize":
      return `${base} Summarize the provided query results in plain language. Respond ONLY with valid JSON: {"explanation": "...", "assumptions": ["..."], "improvements": ["..."]}. No markdown fences.`;
  }
}

function userPrompt(action: AiAction, input: { prompt: string; sql: string; error: string; targetDialect?: string }): string {
  switch (action) {
    case "generate": return input.prompt;
    case "explain": return `Explain this SQL:\n${input.sql || input.prompt}`;
    case "optimize": return `Optimize this SQL:\n${input.sql || input.prompt}`;
    case "debug": return `This SQL failed with error "${input.error}". Fix it:\n${input.sql || input.prompt}`;
    case "convert": return `Convert this SQL to ${input.targetDialect || "PostgreSQL"}:\n${input.sql || input.prompt}`;
    case "practice": return `Generate practice exercises about: ${input.prompt}`;
    case "summarize": return `Summarize these query results:\n${input.prompt}`;
  }
}

export interface GeminiResult {
  sql?: string;
  explanation?: string;
  assumptions?: string[];
  performanceConcerns?: string[];
  improvements?: string[];
}

function safeParse(text: string): GeminiResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return {
      sql: typeof obj.sql === "string" ? obj.sql.slice(0, 20000) : undefined,
      explanation: typeof obj.explanation === "string" ? obj.explanation.slice(0, 12000) : undefined,
      assumptions: Array.isArray(obj.assumptions) ? obj.assumptions.map(String).slice(0, 10) : undefined,
      performanceConcerns: Array.isArray(obj.performanceConcerns) ? obj.performanceConcerns.map(String).slice(0, 10) : undefined,
      improvements: Array.isArray(obj.improvements) ? obj.improvements.map(String).slice(0, 10) : undefined,
    };
  } catch {
    return { explanation: text.slice(0, 8000) };
  }
}

export async function runGemini(
  action: AiAction,
  input: { prompt: string; sql: string; error: string; targetDialect?: string; dialect: string; schema: string }
): Promise<GeminiResult & { model: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt(action, input.dialect, input.schema)}\n\n${userPrompt(action, input)}` }] },
    ],
    config: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: "application/json" },
  });
  const text = res.text ?? "";
  if (!text) throw new Error("Empty response from Gemini.");
  return { ...safeParse(text), model: GEMINI_MODEL };
}

/** Deterministic offline fallback used when GEMINI_API_KEY is missing (clearly labeled demo). */
export function fallbackResponse(action: AiAction, prompt: string): GeminiResult {
  const p = prompt.toLowerCase();
  let sql = "SELECT * FROM customers LIMIT 20;";
  if (p.includes("top") && p.includes("customer")) {
    sql = `SELECT c.id, c.name, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'\nGROUP BY c.id, c.name\nORDER BY total_spent DESC\nLIMIT 5;`;
  } else if (p.includes("order")) {
    sql = `SELECT o.id, c.name AS customer, o.total_amount, o.status, o.created_at\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.created_at DESC\nLIMIT 20;`;
  } else if (p.includes("student") || p.includes("grade")) {
    sql = `SELECT s.name, c.title, g.grade, g.score\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id\nJOIN grades g ON g.enrollment_id = e.id\nORDER BY g.score DESC\nLIMIT 20;`;
  } else if (p.includes("sale") || p.includes("employee")) {
    sql = `SELECT d.name AS department, SUM(s.amount) AS total_sales\nFROM sales s\nJOIN employees e ON e.id = s.employee_id\nJOIN departments d ON d.id = e.department_id\nGROUP BY d.name\nORDER BY total_sales DESC;`;
  }
  return {
    sql,
    explanation:
      action === "explain"
        ? "Demo explanation (Gemini API key not configured): this query reads rows from the listed tables and returns the requested columns."
        : "Demo SQL (Gemini API key not configured). Add GEMINI_API_KEY to enable live AI generation. Review before running.",
    assumptions: ["Demo mode: schema assumed from built-in datasets.", "Date functions use PostgreSQL syntax."],
    performanceConcerns: action === "optimize" ? ["Demo mode: add indexes on foreign-key and filter columns (e.g. orders.customer_id, orders.created_at)."] : [],
    improvements: ["Configure GEMINI_API_KEY for contextual AI answers."],
  };
}
