import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Dedicated pool that always targets the test DB regardless of env.
// Using explicit config (not the app's pool singleton) keeps setup/teardown
// independent of the app under test.
export const testPool = new Pool({
  host: process.env.TEST_DB_HOST ?? "localhost",
  port: parseInt(process.env.TEST_DB_PORT ?? "5433"),
  user: process.env.TEST_DB_USER ?? "postgres",
  password: process.env.TEST_DB_PASSWORD ?? "postgres",
  database: process.env.TEST_DB_NAME ?? "salary_management_test",
});

const SCHEMA_PATH = path.join(__dirname, "../../../src/db/employees.sql");

export async function runMigrations(): Promise<void> {
  const sql = fs.readFileSync(SCHEMA_PATH, "utf-8");
  await testPool.query(sql);
}

export async function truncateEmployees(): Promise<void> {
  await testPool.query("TRUNCATE TABLE employees RESTART IDENTITY CASCADE");
}

export interface SeedRow {
  fullName: string;
  jobTitle: string;
  country: string;
  salary: number;
  department: string;
  email: string;
  hireDate: string;
}

export async function seedEmployees(rows: SeedRow[]): Promise<void> {
  for (const r of rows) {
    await testPool.query(
      `INSERT INTO employees (full_name, job_title, country, salary, department, email, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [r.fullName, r.jobTitle, r.country, r.salary, r.department, r.email, r.hireDate],
    );
  }
}
