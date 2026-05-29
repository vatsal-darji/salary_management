import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const config: PoolConfig = {
  host: isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST,
  port: parseInt(
    isTest
      ? (process.env.TEST_DB_PORT ?? "5433")
      : (process.env.DB_PORT ?? "5432"),
  ),
  user: isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
  password: isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
  database: isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME,
  max: isTest ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

export const getPool = (): Pool => pool;
