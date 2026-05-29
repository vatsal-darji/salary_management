import { pool } from "./pool";
import fs from "fs";
import path from "path";

async function migrate(): Promise<void> {
  const sqlPath = path.join(__dirname, "employees.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Running migrations...");
  try {
    await pool.query(sql);
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    await pool.end();
  }
}

migrate();
