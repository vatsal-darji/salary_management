import request from "supertest";
import { createApp } from "../../src/server";
import {
  runMigrations,
  truncateEmployees,
  seedEmployees,
  testPool,
} from "./helpers/db";

const app = createApp();

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// Small, deterministic dataset so we can assert exact aggregated values.
//
//  Engineering / India    → 2 rows: $80k, $120k  avg=$100k min=$80k  max=$120k
//  Engineering / USA      → 1 row:  $150k         avg=$150k min=$150k max=$150k
//  Marketing   / India    → 1 row:  $60k          avg=$60k  min=$60k  max=$60k
//  Marketing   / USA      → 1 row:  $90k          avg=$90k  min=$90k  max=$90k
//
// Country-level:
//  India: 3 rows ($60k,$80k,$120k) → avg≈$86,667 min=$60k max=$120k
//  United States: 2 rows ($90k,$150k) → avg=$120k min=$90k max=$150k
//
// Distribution:
//  $60k  → "30k–60k" bucket   count=1
//  $80k  → "60k–100k" bucket  count=2 (with $90k)
//  $90k  → "60k–100k" bucket
//  $120k → "100k–150k" bucket count=2 (with $150k)
//  $150k → "100k–150k" bucket

const FIXTURES = [
  { fullName: "Eng India A", jobTitle: "Software Engineer", country: "India",         salary: 80000,  department: "Engineering", email: "eng.india.a@test.com", hireDate: "2021-01-01" },
  { fullName: "Eng India B", jobTitle: "Software Engineer", country: "India",         salary: 120000, department: "Engineering", email: "eng.india.b@test.com", hireDate: "2021-01-01" },
  { fullName: "Eng USA",     jobTitle: "Software Engineer", country: "United States", salary: 150000, department: "Engineering", email: "eng.usa@test.com",     hireDate: "2021-01-01" },
  { fullName: "Mkt India",   jobTitle: "Marketing Manager", country: "India",         salary: 60000,  department: "Marketing",   email: "mkt.india@test.com",   hireDate: "2021-01-01" },
  { fullName: "Mkt USA",     jobTitle: "Marketing Manager", country: "United States", salary: 90000,  department: "Marketing",   email: "mkt.usa@test.com",     hireDate: "2021-01-01" },
];

beforeAll(async () => {
  await runMigrations();
  await truncateEmployees();
  await seedEmployees(FIXTURES);
});

afterAll(async () => {
  await truncateEmployees();
  await testPool.end();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /insights/by-country", () => {
  it("returns correct avg/min/max for each country", async () => {
    const res = await request(app).get("/insights/by-country");

    expect(res.status).toBe(200);

    const india = res.body.find((r: { country: string }) => r.country === "India");
    const usa   = res.body.find((r: { country: string }) => r.country === "United States");

    expect(india).toBeDefined();
    expect(india.minSalary).toBe(60000);
    expect(india.maxSalary).toBe(120000);
    expect(india.employeeCount).toBe(3);
    // avg = (60k+80k+120k)/3 = 86,666.67 — check within $1
    expect(india.avgSalary).toBeCloseTo(86666.67, 0);

    expect(usa).toBeDefined();
    expect(usa.minSalary).toBe(90000);
    expect(usa.maxSalary).toBe(150000);
    expect(usa.employeeCount).toBe(2);
    expect(usa.avgSalary).toBe(120000);
  });

  it("filters by department — Engineering only", async () => {
    const res = await request(app).get("/insights/by-country?department=Engineering");

    expect(res.status).toBe(200);

    // Marketing employees must not affect these numbers
    const india = res.body.find((r: { country: string }) => r.country === "India");
    expect(india.employeeCount).toBe(2); // only the 2 Engineering rows
    expect(india.minSalary).toBe(80000); // 60k Marketing row is excluded
  });
});

describe("GET /insights/by-department", () => {
  it("returns correct aggregation for each department", async () => {
    const res = await request(app).get("/insights/by-department");

    expect(res.status).toBe(200);

    const eng = res.body.find((r: { department: string }) => r.department === "Engineering");
    const mkt = res.body.find((r: { department: string }) => r.department === "Marketing");

    expect(eng).toBeDefined();
    expect(eng.employeeCount).toBe(3);
    expect(eng.minSalary).toBe(80000);
    expect(eng.maxSalary).toBe(150000);

    expect(mkt).toBeDefined();
    expect(mkt.employeeCount).toBe(2);
    expect(mkt.avgSalary).toBe(75000); // (60k+90k)/2
  });
});

describe("GET /insights/distribution", () => {
  it("buckets salaries correctly and counts sum to total rows", async () => {
    const res = await request(app).get("/insights/distribution");

    expect(res.status).toBe(200);

    const totalCount = res.body.reduce(
      (sum: number, b: { count: number }) => sum + b.count,
      0,
    );
    expect(totalCount).toBe(FIXTURES.length);

    const bucket30_60  = res.body.find((b: { range: string }) => b.range === "30k–60k");
    const bucket60_100 = res.body.find((b: { range: string }) => b.range === "60k–100k");
    const bucket100_150 = res.body.find((b: { range: string }) => b.range === "100k–150k");

    // SQL uses strict `salary < N` comparisons:
    // $60k  → NOT < 60000 → "60k–100k"
    // $80k  → "60k–100k"
    // $90k  → "60k–100k"           → bucket total = 3
    // $120k → "100k–150k"          → bucket total = 1
    // $150k → NOT < 150000 → "150k+" → bucket total = 1
    const bucket150plus = res.body.find((b: { range: string }) => b.range === "150k+");

    expect(bucket30_60).toBeUndefined();
    expect(bucket60_100.count).toBe(3);
    expect(bucket100_150.count).toBe(1);
    expect(bucket150plus.count).toBe(1);

    // Percentages should sum to 100
    const totalPct = res.body.reduce(
      (sum: number, b: { percentage: number }) => sum + b.percentage,
      0,
    );
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("filters by country — only USA rows in buckets", async () => {
    const res = await request(app).get("/insights/distribution?country=United+States");

    expect(res.status).toBe(200);

    const total = res.body.reduce(
      (sum: number, b: { count: number }) => sum + b.count,
      0,
    );
    // USA has 2 employees: $90k and $150k
    expect(total).toBe(2);
  });
});
