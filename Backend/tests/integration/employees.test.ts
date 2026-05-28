import request from "supertest";
import { createApp } from "../../src/server";
import {
  runMigrations,
  truncateEmployees,
  seedEmployees,
  testPool,
} from "./helpers/db";

const app = createApp();

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE = {
  jobTitle: "Software Engineer",
  department: "Engineering",
  hireDate: "2022-01-15",
};

// 15 employees: 8 India, 7 United States — enough for pagination (3 pages of 5)
const FIXTURES = [
  { fullName: "Jane Smith",     country: "India",         salary: 95000,  email: "jane.smith@test.com",     ...BASE },
  { fullName: "John Doe",       country: "United States", salary: 120000, email: "john.doe@test.com",       ...BASE },
  { fullName: "Alice Johnson",  country: "India",         salary: 85000,  email: "alice.johnson@test.com",  ...BASE },
  { fullName: "Bob Williams",   country: "United States", salary: 110000, email: "bob.williams@test.com",   ...BASE },
  { fullName: "Carol Brown",    country: "India",         salary: 90000,  email: "carol.brown@test.com",    ...BASE },
  { fullName: "David Jones",    country: "United States", salary: 130000, email: "david.jones@test.com",    ...BASE },
  { fullName: "Eve Davis",      country: "India",         salary: 78000,  email: "eve.davis@test.com",      ...BASE },
  { fullName: "Frank Miller",   country: "United States", salary: 105000, email: "frank.miller@test.com",   ...BASE },
  { fullName: "Grace Wilson",   country: "India",         salary: 92000,  email: "grace.wilson@test.com",   ...BASE },
  { fullName: "Henry Moore",    country: "United States", salary: 115000, email: "henry.moore@test.com",    ...BASE },
  { fullName: "Iris Taylor",    country: "India",         salary: 88000,  email: "iris.taylor@test.com",    ...BASE },
  { fullName: "Jack Anderson",  country: "United States", salary: 125000, email: "jack.anderson@test.com",  ...BASE },
  { fullName: "Karen Thomas",   country: "India",         salary: 82000,  email: "karen.thomas@test.com",   ...BASE },
  { fullName: "Liam Jackson",   country: "India",         salary: 97000,  email: "liam.jackson@test.com",   ...BASE },
  { fullName: "Mia White",      country: "United States", salary: 118000, email: "mia.white@test.com",      ...BASE },
];

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  await runMigrations();
  await truncateEmployees();
  await seedEmployees(FIXTURES);
});

afterAll(async () => {
  await truncateEmployees();
  await testPool.end();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /employees", () => {
  const newEmployee = {
    fullName: "Test User",
    jobTitle: "QA Engineer",
    country: "Germany",
    salary: 70000,
    department: "Engineering",
    email: "test.user@test.com",
    hireDate: "2023-06-01",
  };

  afterEach(async () => {
    await testPool.query("DELETE FROM employees WHERE email = $1", [newEmployee.email]);
  });

  it("creates an employee and returns 201 with the full record", async () => {
    const res = await request(app).post("/employees").send(newEmployee);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.fullName).toBe("Test User");
    expect(res.body.email).toBe("test.user@test.com");
    expect(res.body.salary).toBe(70000);
    // Verify UUID was generated (not null/empty)
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("returns 409 when the email is already in use", async () => {
    // Seed a conflicting email first
    await request(app).post("/employees").send(newEmployee);

    const res = await request(app).post("/employees").send(newEmployee);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });
});

describe("GET /employees/:id", () => {
  it("returns 200 with correct camelCase mapping", async () => {
    // Look up a known seeded employee to get its real UUID
    const { rows } = await testPool.query(
      "SELECT id FROM employees WHERE email = $1",
      ["jane.smith@test.com"],
    );
    const id = rows[0].id;

    const res = await request(app).get(`/employees/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe("Jane Smith");
    expect(res.body.country).toBe("India");
    expect(res.body.salary).toBe(95000);
    // Confirm salary arrives as a number, not a string (NUMERIC type coercion)
    expect(typeof res.body.salary).toBe("number");
  });

  it("returns 404 for a non-existent ID", async () => {
    const res = await request(app).get(
      "/employees/00000000-0000-0000-0000-000000000000",
    );

    expect(res.status).toBe(404);
  });
});

describe("PATCH /employees/:id", () => {
  it("updates salary and returns the new value", async () => {
    const { rows } = await testPool.query(
      "SELECT id FROM employees WHERE email = $1",
      ["john.doe@test.com"],
    );
    const id = rows[0].id;

    const res = await request(app).patch(`/employees/${id}`).send({ salary: 135000 });

    expect(res.status).toBe(200);
    expect(res.body.salary).toBe(135000);

    // Confirm the change is persisted in the DB
    const { rows: dbRows } = await testPool.query(
      "SELECT salary FROM employees WHERE id = $1",
      [id],
    );
    expect(parseFloat(dbRows[0].salary)).toBe(135000);
  });

  it("returns 404 when patching a non-existent employee", async () => {
    const res = await request(app)
      .patch("/employees/00000000-0000-0000-0000-000000000000")
      .send({ salary: 50000 });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /employees/:id", () => {
  it("returns 204 and the employee is gone from the DB", async () => {
    const { rows } = await testPool.query(
      "SELECT id FROM employees WHERE email = $1",
      ["mia.white@test.com"],
    );
    const id = rows[0].id;

    const deleteRes = await request(app).delete(`/employees/${id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/employees/${id}`);
    expect(getRes.status).toBe(404);
  });
});

describe("GET /employees (list)", () => {
  it("paginates correctly — page 2 of 5-per-page returns 5 rows", async () => {
    // afterAll for DELETE test removed mia.white, so we have 14 rows now.
    // Re-check total before asserting pagination.
    const { rows: countRows } = await testPool.query(
      "SELECT COUNT(*)::int AS n FROM employees",
    );
    const total = countRows[0].n;

    const res = await request(app).get("/employees?page=1&pageSize=5");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pageSize).toBe(5);
    expect(res.body.total).toBe(total);
    expect(res.body.totalPages).toBe(Math.ceil(total / 5));
  });

  it("filters by country — only India rows returned", async () => {
    const res = await request(app).get("/employees?country=India");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((emp: { country: string }) => {
      expect(emp.country).toBe("India");
    });
  });

  it("search by name — ILIKE matches partial name", async () => {
    const res = await request(app).get("/employees?search=Jane");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((emp: { fullName: string }) => {
      expect(emp.fullName.toLowerCase()).toContain("jane");
    });
  });
});
