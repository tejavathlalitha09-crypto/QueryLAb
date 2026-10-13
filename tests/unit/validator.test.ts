import { describe, it, expect } from "vitest";
import { validateReadOnly } from "@/lib/sql/validator";

describe("validateReadOnly", () => {
  it("accepts simple SELECT", () => {
    const r = validateReadOnly("SELECT * FROM customers;");
    expect(r.ok).toBe(true);
  });

  it("accepts SELECT with JOIN and WHERE", () => {
    const r = validateReadOnly(
      "SELECT c.name, o.total_amount FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'completed';"
    );
    expect(r.ok).toBe(true);
  });

  it("accepts WITH (CTE)", () => {
    const r = validateReadOnly("WITH t AS (SELECT 1 AS x) SELECT * FROM t;");
    expect(r.ok).toBe(true);
  });

  it("rejects INSERT", () => {
    const r = validateReadOnly("INSERT INTO customers (name) VALUES ('x');");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/read-only|INSERT/i);
  });

  it("rejects UPDATE", () => {
    const r = validateReadOnly("UPDATE customers SET name = 'x';");
    expect(r.ok).toBe(false);
  });

  it("rejects DELETE", () => {
    const r = validateReadOnly("DELETE FROM customers;");
    expect(r.ok).toBe(false);
  });

  it("rejects DROP", () => {
    const r = validateReadOnly("DROP TABLE customers;");
    expect(r.ok).toBe(false);
  });

  it("rejects ALTER", () => {
    const r = validateReadOnly("ALTER TABLE customers ADD COLUMN x int;");
    expect(r.ok).toBe(false);
  });

  it("rejects CREATE", () => {
    const r = validateReadOnly("CREATE TABLE t (id int);");
    expect(r.ok).toBe(false);
  });

  it("rejects TRUNCATE", () => {
    const r = validateReadOnly("TRUNCATE TABLE customers;");
    expect(r.ok).toBe(false);
  });

  it("rejects GRANT", () => {
    const r = validateReadOnly("GRANT SELECT ON customers TO public;");
    expect(r.ok).toBe(false);
  });

  it("rejects REVOKE", () => {
    const r = validateReadOnly("REVOKE SELECT ON customers FROM public;");
    expect(r.ok).toBe(false);
  });

  it("rejects multiple statements", () => {
    const r = validateReadOnly("SELECT 1; SELECT 2;");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/multiple/i);
  });

  it("rejects empty query", () => {
    const r = validateReadOnly("   ");
    expect(r.ok).toBe(false);
  });

  it("rejects INSERT hidden in comment-stripped query", () => {
    const r = validateReadOnly("SELECT 1; -- comment\nINSERT INTO t VALUES (1);");
    expect(r.ok).toBe(false);
  });

  it("rejects write keyword inside string literal is not possible (literal stripped)", () => {
    // After literal stripping, 'INSERT' inside quotes becomes empty, so this is safe
    const r = validateReadOnly("SELECT 'INSERT' AS word;");
    expect(r.ok).toBe(true);
  });
});
