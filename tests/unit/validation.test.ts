import { describe, it, expect } from "vitest";
import { aiSqlRequestSchema } from "@/lib/ai/validation";
import { executeRequestSchema, savedQuerySchema } from "@/lib/validation/schemas";

describe("aiSqlRequestSchema", () => {
  it("accepts valid generate request", () => {
    const r = aiSqlRequestSchema.safeParse({
      action: "generate",
      prompt: "Find top customers",
      dialect: "PostgreSQL",
      schema: "customers(id, name)",
    });
    expect(r.success).toBe(true);
  });

  it("accepts all actions", () => {
    for (const action of ["generate", "explain", "optimize", "debug", "convert", "practice", "summarize"]) {
      const r = aiSqlRequestSchema.safeParse({ action, prompt: "test" });
      expect(r.success).toBe(true);
    }
  });

  it("rejects invalid action", () => {
    const r = aiSqlRequestSchema.safeParse({ action: "hack", prompt: "test" });
    expect(r.success).toBe(false);
  });

  it("rejects empty prompt", () => {
    const r = aiSqlRequestSchema.safeParse({ action: "generate", prompt: "" });
    expect(r.success).toBe(false);
  });

  it("rejects oversized prompt", () => {
    const r = aiSqlRequestSchema.safeParse({ action: "generate", prompt: "x".repeat(9000) });
    expect(r.success).toBe(false);
  });

  it("applies defaults", () => {
    const r = aiSqlRequestSchema.safeParse({ action: "generate", prompt: "test" });
    expect(r.success && r.data.dialect).toBe("PostgreSQL");
  });
});

describe("executeRequestSchema", () => {
  it("accepts valid request", () => {
    const r = executeRequestSchema.safeParse({ sql: "SELECT 1;", limit: 100, timeoutMs: 5000 });
    expect(r.success).toBe(true);
  });

  it("applies defaults", () => {
    const r = executeRequestSchema.safeParse({ sql: "SELECT 1;" });
    expect(r.success && r.data.limit).toBe(500);
    expect(r.success && r.data.timeoutMs).toBe(10000);
  });

  it("rejects empty SQL", () => {
    const r = executeRequestSchema.safeParse({ sql: "" });
    expect(r.success).toBe(false);
  });

  it("rejects oversized SQL", () => {
    const r = executeRequestSchema.safeParse({ sql: "x".repeat(21000) });
    expect(r.success).toBe(false);
  });
});

describe("savedQuerySchema", () => {
  it("accepts valid query", () => {
    const r = savedQuerySchema.safeParse({
      title: "My query",
      sql_text: "SELECT 1;",
      tags: ["test"],
    });
    expect(r.success).toBe(true);
  });

  it("requires title", () => {
    const r = savedQuerySchema.safeParse({ sql_text: "SELECT 1;" });
    expect(r.success).toBe(false);
  });

  it("requires sql_text", () => {
    const r = savedQuerySchema.safeParse({ title: "Test" });
    expect(r.success).toBe(false);
  });
});
