export interface DemoColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: { table: string; column: string };
}

export interface DemoTable {
  name: string;
  dataset: string;
  description: string;
  columns: DemoColumn[];
  rows: Record<string, unknown>[];
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  tables: string[];
}

// Deterministic pseudo-random for stable seeds
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const first = ["Ava","Liam","Maya","Noah","Priya","Kiran","Sofia","Arjun","Elena","Ravi","Nina","Dev","Sara","Kabir","Meera","Tom","Aisha","Rohan","Zara","Ishaan"];
const last = ["Sharma","Patel","Iyer","Khan","Gupta","Reddy","Nair","Singh","Das","Kulkarni","Mehta","Joshi","Chopra","Verma"," Rao".trim(),"Menon","Agarwal","Bose","Pillai","Kaur"];
const cities = ["Bengaluru","Mumbai","Delhi","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Kochi"];
const products: [string, string, number][] = [
  ["Wireless Mouse", "Electronics", 899],
  ["Mechanical Keyboard", "Electronics", 3499],
  ["USB-C Hub", "Electronics", 1999],
  ["Noise-Cancelling Headphones", "Electronics", 7999],
  ["Cotton T-Shirt", "Apparel", 499],
  ["Denim Jeans", "Apparel", 1499],
  ["Running Shoes", "Apparel", 2999],
  ["Ceramic Mug", "Home", 349],
  ["Desk Lamp", "Home", 1299],
  ["Notebook Set", "Stationery", 299],
  ["Water Bottle", "Home", 699],
  ["Backpack", "Apparel", 1899],
];
const courses: [string, string, number][] = [
  ["Intro to SQL", "CS101", 4],
  ["Data Structures", "CS201", 4],
  ["Web Development", "CS210", 3],
  ["Machine Learning", "CS340", 4],
  ["Statistics", "MA220", 3],
  ["Economics 101", "EC101", 3],
];
const depts: [string, string][] = [
  ["Engineering", "Bengaluru"],
  ["Sales", "Mumbai"],
  ["Marketing", "Delhi"],
  ["Support", "Hyderabad"],
  ["Finance", "Chennai"],
];

function buildTables(): Record<string, DemoTable> {
  const t: Record<string, DemoTable> = {};
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

  // ---- E-commerce ----
  const customers = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `${first[i % first.length]} ${last[(i * 3 + 1) % last.length]}`,
    email: `customer${i + 1}@example.com`,
    city: pick(cities),
    created_at: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  }));
  const prods = products.map((p, i) => ({ id: i + 1, name: p[0], category: p[1], price: p[2], stock: 10 + Math.floor(r() * 200) }));
  const orders: Record<string, unknown>[] = [];
  const items: Record<string, unknown>[] = [];
  let oid = 1, iid = 1;
  for (let i = 0; i < 60; i++) {
    const cid = 1 + Math.floor(r() * 25);
    const daysAgo = Math.floor(r() * 180);
    const d = new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);
    const status = pick(["completed", "completed", "completed", "pending", "cancelled"]);
    const nItems = 1 + Math.floor(r() * 3);
    let total = 0;
    const orderId = oid++;
    for (let k = 0; k < nItems; k++) {
      const p = pick(prods);
      const qty = 1 + Math.floor(r() * 3);
      total += p.price * qty;
      items.push({ id: iid++, order_id: orderId, product_id: p.id, quantity: qty, unit_price: p.price });
    }
    orders.push({ id: orderId, customer_id: cid, status, total_amount: total, created_at: d });
  }

  // ---- Education ----
  const students = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `${first[(i * 2 + 1) % first.length]} ${last[(i * 5 + 2) % last.length]}`,
    email: `student${i + 1}@university.edu`,
    enrollment_year: 2022 + (i % 4),
  }));
  const crs = courses.map((c, i) => ({ id: i + 1, title: c[0], code: c[1], credits: c[2] }));
  const enrollments: Record<string, unknown>[] = [];
  const grades: Record<string, unknown>[] = [];
  let eid = 1, gid = 1;
  for (const s of students) {
    const n = 2 + Math.floor(r() * 3);
    const taken = new Set<number>();
    for (let k = 0; k < n; k++) {
      const cid = 1 + Math.floor(r() * crs.length);
      if (taken.has(cid)) continue;
      taken.add(cid);
      enrollments.push({ id: eid, student_id: s.id, course_id: cid, semester: pick(["Fall 2024", "Spring 2025", "Fall 2025"]) });
      grades.push({ id: gid++, enrollment_id: eid, grade: pick(["A", "A", "B", "B", "C", "A", "B"]), score: 60 + Math.floor(r() * 40) });
      eid++;
    }
  }

  // ---- Business ----
  const departments = depts.map((d, i) => ({ id: i + 1, name: d[0], location: d[1] }));
  const employees = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `${first[(i * 3 + 2) % first.length]} ${last[(i * 7 + 3) % last.length]}`,
    department_id: 1 + (i % 5),
    salary: 400000 + Math.floor(r() * 1400000),
    hire_date: `202${1 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-15`,
  }));
  const sales = Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    employee_id: 1 + Math.floor(r() * 20),
    amount: 5000 + Math.floor(r() * 95000),
    sale_date: new Date(Date.now() - Math.floor(r() * 180) * 864e5).toISOString().slice(0, 10),
    region: pick(["North", "South", "East", "West"]),
  }));

  const col = (name: string, type: string, extra?: Partial<DemoColumn>): DemoColumn => ({ name, type, ...extra });
  const def = (name: string, dataset: string, description: string, columns: DemoColumn[], rows: Record<string, unknown>[]): DemoTable =>
    ({ name, dataset, description, columns, rows });

  Object.assign(t, {
    customers: def("customers", "ecommerce", "E-commerce customers", [
      col("id", "integer", { pk: true }), col("name", "text"), col("email", "text"), col("city", "text"), col("created_at", "date"),
    ], customers),
    products: def("products", "ecommerce", "Product catalog", [
      col("id", "integer", { pk: true }), col("name", "text"), col("category", "text"), col("price", "integer"), col("stock", "integer"),
    ], prods),
    orders: def("orders", "ecommerce", "Customer orders", [
      col("id", "integer", { pk: true }),
      col("customer_id", "integer", { fk: { table: "customers", column: "id" } }),
      col("status", "text"), col("total_amount", "integer"), col("created_at", "date"),
    ], orders),
    order_items: def("order_items", "ecommerce", "Line items per order", [
      col("id", "integer", { pk: true }),
      col("order_id", "integer", { fk: { table: "orders", column: "id" } }),
      col("product_id", "integer", { fk: { table: "products", column: "id" } }),
      col("quantity", "integer"), col("unit_price", "integer"),
    ], items),
    students: def("students", "education", "Enrolled students", [
      col("id", "integer", { pk: true }), col("name", "text"), col("email", "text"), col("enrollment_year", "integer"),
    ], students),
    courses: def("courses", "education", "Course catalog", [
      col("id", "integer", { pk: true }), col("title", "text"), col("code", "text"), col("credits", "integer"),
    ], crs),
    enrollments: def("enrollments", "education", "Student ↔ course links", [
      col("id", "integer", { pk: true }),
      col("student_id", "integer", { fk: { table: "students", column: "id" } }),
      col("course_id", "integer", { fk: { table: "courses", column: "id" } }),
      col("semester", "text"),
    ], enrollments),
    grades: def("grades", "education", "Grades per enrollment", [
      col("id", "integer", { pk: true }),
      col("enrollment_id", "integer", { fk: { table: "enrollments", column: "id" } }),
      col("grade", "text"), col("score", "integer"),
    ], grades),
    departments: def("departments", "business", "Company departments", [
      col("id", "integer", { pk: true }), col("name", "text"), col("location", "text"),
    ], departments),
    employees: def("employees", "business", "Employees", [
      col("id", "integer", { pk: true }), col("name", "text"),
      col("department_id", "integer", { fk: { table: "departments", column: "id" } }),
      col("salary", "integer"), col("hire_date", "date"),
    ], employees),
    sales: def("sales", "business", "Sales transactions", [
      col("id", "integer", { pk: true }),
      col("employee_id", "integer", { fk: { table: "employees", column: "id" } }),
      col("amount", "integer"), col("sale_date", "date"), col("region", "text"),
    ], sales),
  });
  return t;
}

let cache: Record<string, DemoTable> | null = null;
export function getDemoTables(): Record<string, DemoTable> {
  if (!cache) cache = buildTables();
  return cache;
}

export const DATASETS: Dataset[] = [
  { id: "ecommerce", name: "E-commerce", description: "Customers, products, orders and line items.", tables: ["customers", "products", "orders", "order_items"] },
  { id: "education", name: "Education", description: "Students, courses, enrollments and grades.", tables: ["students", "courses", "enrollments", "grades"] },
  { id: "business", name: "Business Analytics", description: "Departments, employees and sales.", tables: ["departments", "employees", "sales"] },
];
