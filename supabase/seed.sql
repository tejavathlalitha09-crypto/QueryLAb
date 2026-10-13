-- QueryLab demo dataset seed
-- This seed is for the ISOLATED playground database (SQL_EXECUTION_DATABASE_URL),
-- not the Supabase application database. Run it there to enable real PostgreSQL
-- execution. The built-in demo engine (used when no execution URL is configured)
-- seeds the same tables in-memory.

-- E-commerce
create table if not exists customers (
  id integer primary key,
  name text not null,
  email text not null,
  city text not null,
  created_at date not null
);

create table if not exists products (
  id integer primary key,
  name text not null,
  category text not null,
  price integer not null,
  stock integer not null default 0
);

create table if not exists orders (
  id integer primary key,
  customer_id integer not null references customers(id),
  status text not null,
  total_amount integer not null,
  created_at date not null
);

create table if not exists order_items (
  id integer primary key,
  order_id integer not null references orders(id),
  product_id integer not null references products(id),
  quantity integer not null,
  unit_price integer not null
);

-- Education
create table if not exists students (
  id integer primary key,
  name text not null,
  email text not null,
  enrollment_year integer not null
);

create table if not exists courses (
  id integer primary key,
  title text not null,
  code text not null,
  credits integer not null
);

create table if not exists enrollments (
  id integer primary key,
  student_id integer not null references students(id),
  course_id integer not null references courses(id),
  semester text not null
);

create table if not exists grades (
  id integer primary key,
  enrollment_id integer not null references enrollments(id),
  grade text not null,
  score integer not null
);

-- Business
create table if not exists departments (
  id integer primary key,
  name text not null,
  location text not null
);

create table if not exists employees (
  id integer primary key,
  name text not null,
  department_id integer not null references departments(id),
  salary integer not null,
  hire_date date not null
);

create table if not exists sales (
  id integer primary key,
  employee_id integer not null references employees(id),
  amount integer not null,
  sale_date date not null,
  region text not null
);

-- Sample data (fictional)
insert into customers (id, name, email, city, created_at) values
  (1, 'Ava Sharma', 'customer1@example.com', 'Bengaluru', '2025-01-05'),
  (2, 'Liam Patel', 'customer2@example.com', 'Mumbai', '2025-02-11'),
  (3, 'Maya Iyer', 'customer3@example.com', 'Delhi', '2025-03-02'),
  (4, 'Noah Khan', 'customer4@example.com', 'Hyderabad', '2025-01-20'),
  (5, 'Priya Gupta', 'customer5@example.com', 'Chennai', '2025-04-15'),
  (6, 'Kiran Reddy', 'customer6@example.com', 'Pune', '2025-05-01'),
  (7, 'Sofia Nair', 'customer7@example.com', 'Kolkata', '2025-03-22'),
  (8, 'Arjun Singh', 'customer8@example.com', 'Ahmedabad', '2025-02-28'),
  (9, 'Elena Das', 'customer9@example.com', 'Jaipur', '2025-06-10'),
  (10, 'Ravi Kulkarni', 'customer10@example.com', 'Kochi', '2025-01-30')
on conflict (id) do nothing;

insert into products (id, name, category, price, stock) values
  (1, 'Wireless Mouse', 'Electronics', 899, 120),
  (2, 'Mechanical Keyboard', 'Electronics', 3499, 45),
  (3, 'USB-C Hub', 'Electronics', 1999, 80),
  (4, 'Noise-Cancelling Headphones', 'Electronics', 7999, 30),
  (5, 'Cotton T-Shirt', 'Apparel', 499, 200),
  (6, 'Denim Jeans', 'Apparel', 1499, 150),
  (7, 'Running Shoes', 'Apparel', 2999, 90),
  (8, 'Ceramic Mug', 'Home', 349, 300),
  (9, 'Desk Lamp', 'Home', 1299, 60),
  (10, 'Notebook Set', 'Stationery', 299, 250)
on conflict (id) do nothing;

insert into orders (id, customer_id, status, total_amount, created_at) values
  (1, 1, 'completed', 1798, '2025-06-01'),
  (2, 2, 'completed', 3499, '2025-06-02'),
  (3, 3, 'pending', 499, '2025-06-03'),
  (4, 1, 'completed', 7999, '2025-06-04'),
  (5, 5, 'completed', 2398, '2025-06-05'),
  (6, 4, 'cancelled', 899, '2025-06-06'),
  (7, 6, 'completed', 4498, '2025-06-07'),
  (8, 2, 'completed', 1299, '2025-06-08'),
  (9, 7, 'completed', 2999, '2025-06-09'),
  (10, 8, 'completed', 6498, '2025-06-10')
on conflict (id) do nothing;

insert into order_items (id, order_id, product_id, quantity, unit_price) values
  (1, 1, 1, 2, 899),
  (2, 2, 2, 1, 3499),
  (3, 3, 5, 1, 499),
  (4, 4, 4, 1, 7999),
  (5, 5, 6, 1, 1499),
  (6, 5, 8, 2, 349),
  (7, 6, 1, 1, 899),
  (8, 7, 3, 1, 1999),
  (9, 7, 9, 1, 1299),
  (10, 7, 10, 1, 299),
  (11, 8, 9, 1, 1299),
  (12, 9, 7, 1, 2999),
  (13, 10, 2, 1, 3499),
  (14, 10, 4, 1, 7999),
  (15, 10, 8, 1, 349)
on conflict (id) do nothing;

insert into students (id, name, email, enrollment_year) values
  (1, 'Ava Sharma', 'student1@university.edu', 2023),
  (2, 'Liam Patel', 'student2@university.edu', 2022),
  (3, 'Maya Iyer', 'student3@university.edu', 2024),
  (4, 'Noah Khan', 'student4@university.edu', 2023),
  (5, 'Priya Gupta', 'student5@university.edu', 2022)
on conflict (id) do nothing;

insert into courses (id, title, code, credits) values
  (1, 'Intro to SQL', 'CS101', 4),
  (2, 'Data Structures', 'CS201', 4),
  (3, 'Web Development', 'CS210', 3),
  (4, 'Machine Learning', 'CS340', 4),
  (5, 'Statistics', 'MA220', 3)
on conflict (id) do nothing;

insert into enrollments (id, student_id, course_id, semester) values
  (1, 1, 1, 'Fall 2024'),
  (2, 1, 2, 'Fall 2024'),
  (3, 2, 1, 'Spring 2025'),
  (4, 2, 3, 'Spring 2025'),
  (5, 3, 4, 'Fall 2025'),
  (6, 4, 2, 'Fall 2024'),
  (7, 5, 5, 'Spring 2025')
on conflict (id) do nothing;

insert into grades (id, enrollment_id, grade, score) values
  (1, 1, 'A', 92),
  (2, 2, 'B', 81),
  (3, 3, 'A', 88),
  (4, 4, 'B', 79),
  (5, 5, 'A', 95),
  (6, 6, 'C', 65),
  (7, 7, 'B', 83)
on conflict (id) do nothing;

insert into departments (id, name, location) values
  (1, 'Engineering', 'Bengaluru'),
  (2, 'Sales', 'Mumbai'),
  (3, 'Marketing', 'Delhi'),
  (4, 'Support', 'Hyderabad'),
  (5, 'Finance', 'Chennai')
on conflict (id) do nothing;

insert into employees (id, name, department_id, salary, hire_date) values
  (1, 'Ava Sharma', 1, 1200000, '2021-03-15'),
  (2, 'Liam Patel', 1, 950000, '2022-06-01'),
  (3, 'Maya Iyer', 2, 700000, '2021-08-20'),
  (4, 'Noah Khan', 2, 650000, '2023-01-10'),
  (5, 'Priya Gupta', 3, 600000, '2022-11-05'),
  (6, 'Kiran Reddy', 4, 550000, '2023-04-18'),
  (7, 'Sofia Nair', 5, 800000, '2021-05-22'),
  (8, 'Arjun Singh', 1, 1100000, '2022-02-14')
on conflict (id) do nothing;

insert into sales (id, employee_id, amount, sale_date, region) values
  (1, 1, 45000, '2025-06-01', 'North'),
  (2, 2, 32000, '2025-06-02', 'South'),
  (3, 3, 78000, '2025-06-03', 'East'),
  (4, 4, 21000, '2025-06-04', 'West'),
  (5, 5, 56000, '2025-06-05', 'North'),
  (6, 6, 34000, '2025-06-06', 'South'),
  (7, 7, 91000, '2025-06-07', 'East'),
  (8, 8, 47000, '2025-06-08', 'West'),
  (9, 1, 62000, '2025-06-09', 'North'),
  (10, 3, 38000, '2025-06-10', 'South')
on conflict (id) do nothing;

-- Read-only role for the playground (run as postgres superuser, then grant):
-- create role querylab_readonly login password 'CHANGE_ME';
-- grant usage on schema public to querylab_readonly;
-- grant select on all tables in schema public to querylab_readonly;
-- alter default privileges in schema public grant select on tables to querylab_readonly;
