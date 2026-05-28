import request from "supertest";
import express from "express";
import { createEmployeeRouter } from "../../src/employees/employee.router";
import { EmployeeService } from "../../src/employees/employee.service";
import { NotFoundError, ConflictError } from "../../src/errors";
import { errorMiddleware } from "../../src/utils/errorMiddleware";

const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<EmployeeService>;

const app = express();
app.use(express.json());
app.use("/employees", createEmployeeRouter(mockService));
app.use(errorMiddleware);

const sampleEmployee = {
  id: "uuid-001",
  fullName: "Jane Doe",
  jobTitle: "Software Engineer",
  country: "India",
  salary: 95000,
  department: "Engineering",
  email: "jane.doe@example.com",
  hireDate: new Date("2022-03-15").toISOString(),
  createdAt: new Date("2022-03-15").toISOString(),
  updatedAt: new Date("2022-03-15").toISOString(),
};

const validCreateBody = {
  fullName: "Jane Doe",
  jobTitle: "Software Engineer",
  country: "India",
  salary: 95000,
  department: "Engineering",
  email: "jane.doe@example.com",
  hireDate: "2022-03-15",
};

describe("Employee Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── GET /employees ──────────────────────────────────────────────────────────

  describe("GET /employees", () => {
    it("returns 200 with paginated list", async () => {
      mockService.list.mockResolvedValueOnce({
        data: [sampleEmployee] as any,
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const res = await request(app).get("/employees");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data).toHaveLength(1);
    });

    it("passes query filters to service", async () => {
      mockService.list.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 2,
        pageSize: 5,
        totalPages: 0,
      });

      await request(app).get("/employees?country=India&page=2&pageSize=5");

      expect(mockService.list).toHaveBeenCalledWith(
        expect.objectContaining({ country: "India", page: 2, pageSize: 5 }),
      );
    });
  });

  // ─── GET /employees/:id ──────────────────────────────────────────────────────

  describe("GET /employees/:id", () => {
    it("returns 200 with the employee when found", async () => {
      mockService.getById.mockResolvedValueOnce(sampleEmployee as any);

      const res = await request(app).get("/employees/uuid-001");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("uuid-001");
    });

    it("returns 404 when employee does not exist", async () => {
      mockService.getById.mockRejectedValueOnce(
        new NotFoundError("Employee not found: bad-id"),
      );

      const res = await request(app).get("/employees/bad-id");

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /employees ─────────────────────────────────────────────────────────

  describe("POST /employees", () => {
    it("returns 201 with the created employee", async () => {
      mockService.create.mockResolvedValueOnce(sampleEmployee as any);

      const res = await request(app).post("/employees").send(validCreateBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("uuid-001");
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/employees")
        .send({ fullName: "Jane" });

      expect(res.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid email", async () => {
      const res = await request(app)
        .post("/employees")
        .send({ ...validCreateBody, email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("returns 400 for a negative salary", async () => {
      const res = await request(app)
        .post("/employees")
        .send({ ...validCreateBody, salary: -100 });

      expect(res.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("returns 409 when email is already in use", async () => {
      mockService.create.mockRejectedValueOnce(
        new ConflictError("Email already in use: jane.doe@example.com"),
      );

      const res = await request(app).post("/employees").send(validCreateBody);

      expect(res.status).toBe(409);
    });
  });

  // ─── PATCH /employees/:id ────────────────────────────────────────────────────

  describe("PATCH /employees/:id", () => {
    it("returns 200 with the updated employee", async () => {
      const updated = { ...sampleEmployee, salary: 110000 };
      mockService.update.mockResolvedValueOnce(updated as any);

      const res = await request(app)
        .patch("/employees/uuid-001")
        .send({ salary: 110000 });

      expect(res.status).toBe(200);
      expect(res.body.salary).toBe(110000);
    });

    it("returns 400 for an invalid email on update", async () => {
      const res = await request(app)
        .patch("/employees/uuid-001")
        .send({ email: "bad-email" });

      expect(res.status).toBe(400);
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it("returns 400 for a negative salary on update", async () => {
      const res = await request(app)
        .patch("/employees/uuid-001")
        .send({ salary: -1 });

      expect(res.status).toBe(400);
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it("returns 404 when employee does not exist", async () => {
      mockService.update.mockRejectedValueOnce(
        new NotFoundError("Employee not found: bad-id"),
      );

      const res = await request(app)
        .patch("/employees/bad-id")
        .send({ salary: 50000 });

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /employees/:id ───────────────────────────────────────────────────

  describe("DELETE /employees/:id", () => {
    it("returns 204 on successful delete", async () => {
      mockService.delete.mockResolvedValueOnce(true);

      const res = await request(app).delete("/employees/uuid-001");

      expect(res.status).toBe(204);
    });

    it("returns 404 when employee does not exist", async () => {
      mockService.delete.mockRejectedValueOnce(
        new NotFoundError("Employee not found: bad-id"),
      );

      const res = await request(app).delete("/employees/bad-id");

      expect(res.status).toBe(404);
    });
  });
});
