import { describe, it, expect } from "vitest";
import { toCsv, buildQueryReport } from "@/lib/exports/csv";

describe("toCsv", () => {
  it("exports simple rows", () => {
    const csv = toCsv(["name", "age"], [{ name: "Alice", age: 30 }]);
    expect(csv).toBe("name,age\r\nAlice,30");
  });

  it("escapes commas", () => {
    const csv = toCsv(["name"], [{ name: "Doe, John" }]);
    expect(csv).toBe('name\r\n"Doe, John"');
  });

  it("escapes quotes", () => {
    const csv = toCsv(["name"], [{ name: 'Say "hi"' }]);
    expect(csv).toBe('name\r\n"Say ""hi"""');
  });

  it("escapes newlines", () => {
    const csv = toCsv(["name"], [{ name: "line1\nline2" }]);
    expect(csv).toBe('name\r\n"line1\nline2"');
  });

  it("handles null and undefined", () => {
    const csv = toCsv(["a", "b"], [{ a: null, b: undefined }]);
    expect(csv).toBe("a,b\r\n,");
  });

  it("handles numbers", () => {
    const csv = toCsv(["n"], [{ n: 42 }]);
    expect(csv).toBe("n\r\n42");
  });

  it("handles empty rows", () => {
    const csv = toCsv(["a"], []);
    expect(csv).toBe("a");
  });
});

describe("buildQueryReport", () => {
  it("includes all fields", () => {
    const report = buildQueryReport({
      sql: "SELECT 1;",
      status: "success",
      durationMs: 12,
      rowCount: 1,
      timestamp: "2025-01-01T00:00:00Z",
      scope: "complete result set",
    });
    expect(report).toContain("SELECT 1;");
    expect(report).toContain("success");
    expect(report).toContain("12ms");
    expect(report).toContain("complete result set");
  });
});
