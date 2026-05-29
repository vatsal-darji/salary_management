import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";
import { errorMiddleware } from "./utils/errorMiddleware";
import { EmployeeRepository } from "./employees/employee.repository";
import { EmployeeService } from "./employees/employee.service";
import { createEmployeeRouter } from "./employees/employee.router";
import { InsightsRepository } from "./insights/insights.repository";
import { InsightsService } from "./insights/insights.service";
import { createInsightsRouter } from "./insights/insights.router";

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

  const employeeRepo = new EmployeeRepository(pool);
  const employeeService = new EmployeeService(employeeRepo);
  app.use("/employees", createEmployeeRouter(employeeService));

  const insightsRepo = new InsightsRepository(pool);
  const insightsService = new InsightsService(insightsRepo);
  app.use("/insights", createInsightsRouter(insightsService));

  app.use(errorMiddleware);

  return app;
};

// Only start the HTTP server when this file is the entry point.
// Importing createApp() in tests must not bind a port.
if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  const app = createApp();
  app.listen(PORT, async () => {
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
}
