import { describe, it, expect } from "vitest";
import { executeDemo } from "@/lib/sql/demo-engine";

describe("executeDemo", () => {
  // Seed data has 25 customers, 60 orders, etc.
  const seed = { customers: 25, orders: 60, products: 10, students: 5 };

  it("executes simple SELECT *", () => {
    const r = executeDemo("SELECT * FROM customers;");
    expect(r.columns.map((c) => c.name)).toEqual(["id", "name", "email", "city", "created_at"]);
    expect(r.rows.length).toBe(25);  // 25 customers seeded
  });

  it("executes SELECT with WHERE", () => {
    const r = executeDemo("SELECT name, city FROM customers WHERE city = 'Mumbai';");
    expect(r.rows.length).toBeGreaterThan(0);
    expect(r.rows.every((row) => row.city === "Mumbai")).toBe(true);
  });

  it("executes SELECT with ORDER BY", () => {
    const r = executeDemo("SELECT name FROM customers ORDER BY name ASC LIMIT 1;");
    // Demo engine: first row after alphabetical sort
    expect(r.rows.length).toBe(1);
  });

  it("executes IN", () => {
    const r = executeDemo("SELECT name FROM customers WHERE city IN ('Mumbai', 'Delhi');");
    expect(r.rows.length).toBeGreaterThan(0);
  });

  it("executes IS NOT NULL", () => {
    const r = executeDemo("SELECT name FROM customers WHERE email IS NOT NULL;");
    expect(r.rows.length).toBe(25);  // all seeded customers have email
  });

  it("executes OFFSET with LIMIT", () => {
    // LIMIT 2 OFFSET 2 on 25 customers → rows 3 and 4 (ids 3 and 4)
    const r = executeDemo("SELECT id FROM customers ORDER BY id LIMIT 2 OFFSET 2;");
    expect(r.rows.length).toBe(2);
    expect(r.rows[0].id).toBe(3);
    expect(r.rows[1].id).toBe(4);
  });

  it("executes arithmetic in SELECT", () => {
    const r = executeDemo("SELECT price * 2 AS doubled FROM products LIMIT 1;");
    // First product price is 899 (Wireless Mouse), 899*2 = 1798
    expect(r.rows[0].doubled).toBe(1798);
  });

  it("executes COUNT(*) with correct seed count", () => {
    const r = executeDemo("SELECT COUNT(*) AS total FROM orders;");
    expect(r.rows[0].total).toBe(60);  // 60 orders seeded
  });

  it("executes DISTINCT", () => {
    const r = executeDemo("SELECT DISTINCT city FROM customers;");
    const cities = r.rows.map((row) => row.city);
    expect(new Set(cities).size).toBe(cities.length);
  });

  it("executes LIKE", () => {
    const r = executeDemo("SELECT name FROM customers WHERE name LIKE 'A%';");
    expect(r.rows.length).toBeGreaterThan(0);
  });

  it("executes empty result set with columns", () => {
    const r = executeDemo("SELECT * FROM customers WHERE id = -1;");
    expect(r.rows.length).toBe(0);
    expect(r.columns.length).toBeGreaterThan(0);  // should have columns defined even for empty results
  });
});