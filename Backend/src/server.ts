import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";

dotenv.config();

async function connectDB() {
  const client = await pool.connect();
  client.release();
}

export const createApp = (): express.Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
};

const PORT = process.env.PORT ?? 3001;

const app = createApp();
app.listen(PORT, async() => {
  try {
    await connectDB();
    console.log(" Database connected successfully");
  } catch (error: any) {
    console.warn(
      "Database connection failed, starting server without DB:",
      error.message,
    );
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
