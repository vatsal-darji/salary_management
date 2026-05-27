import { EmployeeRepository } from "../../src/employees/employees.types";
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
} from "../../src/employees/employees.types";
import { Pool, QueryResult } from "pg";

// Mock the pg Pool
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

const sampleEmployee = {
  id: "uuid-001",
  full_name: "Jane Doe",
  job_title: "Software Engineer",
  country: "India",
  salary: "95000.00",
  department: "Engineering",
  email: "jane.doe@example.com",
  hire_date: new Date("2022-03-15"),
  created_at: new Date("2022-03-15"),
  updated_at: new Date("2022-03-15"),
};

const makeQueryResult = (rows: object[]): QueryResult => ({
  rows,
  rowCount: rows.length,
  command: "",
  oid: 0,
  fields: [],
});

describe("Employee", () => {
  let repo: EmployeeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new EmployeeRepository(mockPool);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe("findAll", () => {
    it("returns a paginated list of employees with default pagination", async () => {
      mockQuery
        .mockResolvedValueOnce(makeQueryResult([{ total: "2" }])) // count query
        .mockResolvedValueOnce(
          makeQueryResult([
            sampleEmployee,
            { ...sampleEmployee, id: "uuid-002", email: "b@b.com" },
          ]),
        );

      const result = await repo.findAll({});

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it("filters by country", async () => {
      mockQuery
        .mockResolvedValueOnce(makeQueryResult([{ total: "1" }]))
        .mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.findAll({ country: "India" });

      expect(result.data).toHaveLength(1);
      const [countCall, dataCall] = mockQuery.mock.calls;
      expect(countCall[0]).toMatch(/country/i);
      expect(dataCall[0]).toMatch(/country/i);
    });

    it("filters by department", async () => {
      mockQuery
        .mockResolvedValueOnce(makeQueryResult([{ total: "1" }]))
        .mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.findAll({ department: "Engineering" });

      expect(result.data).toHaveLength(1);
    });

    it("supports full-text search on name", async () => {
      mockQuery
        .mockResolvedValueOnce(makeQueryResult([{ total: "1" }]))
        .mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.findAll({ search: "Jane" });

      expect(result.data).toHaveLength(1);
      const [, dataCall] = mockQuery.mock.calls;
      expect(dataCall[0]).toMatch(/to_tsvector|ILIKE/i);
    });

    it("respects page and pageSize", async () => {
      mockQuery
        .mockResolvedValueOnce(makeQueryResult([{ total: "50" }]))
        .mockResolvedValueOnce(makeQueryResult([]));

      const result = await repo.findAll({ page: 3, pageSize: 10 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(5);
      const [, dataCall] = mockQuery.mock.calls;
      expect(dataCall[1]).toContain(20); // OFFSET = (3-1)*10 = 20
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("returns an employee when found", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.findById("uuid-001");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("uuid-001");
      expect(result?.fullName).toBe("Jane Doe");
      expect(result?.salary).toBe(95000);
    });

    it("returns null when employee does not exist", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([]));

      const result = await repo.findById("non-existent-id");

      expect(result).toBeNull();
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    const dto: CreateEmployeeDTO = {
      fullName: "Jane Doe",
      jobTitle: "Software Engineer",
      country: "India",
      salary: 95000,
      department: "Engineering",
      email: "jane.doe@example.com",
      hireDate: new Date("2022-03-15"),
    };

    it("inserts a new employee and returns the created record", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.create(dto);

      expect(result.id).toBe("uuid-001");
      expect(result.fullName).toBe("Jane Doe");
      expect(result.email).toBe("jane.doe@example.com");
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("passes all fields to the INSERT query", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      await repo.create(dto);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/INSERT INTO employees/i);
      expect(params).toContain("Jane Doe");
      expect(params).toContain("jane.doe@example.com");
      expect(params).toContain(95000);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates an employee and returns the updated record", async () => {
      const updatedRow = { ...sampleEmployee, salary: "110000.00" };
      mockQuery.mockResolvedValueOnce(makeQueryResult([updatedRow]));

      const dto: UpdateEmployeeDTO = { salary: 110000 };
      const result = await repo.update("uuid-001", dto);

      expect(result).not.toBeNull();
      expect(result?.salary).toBe(110000);
    });

    it("returns null when updating a non-existent employee", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([]));

      const result = await repo.update("bad-id", { salary: 50000 });

      expect(result).toBeNull();
    });

    it("builds a dynamic SET clause with only provided fields", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      await repo.update("uuid-001", { salary: 100000 });

      const [sql] = mockQuery.mock.calls[0];
      const setClause = sql.match(/SET([\s\S]*?)WHERE/i)?.[1] ?? "";
      expect(setClause).toMatch(/salary/i);
      expect(setClause).not.toMatch(/full_name/i);
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("returns true when employee is successfully deleted", async () => {
      mockQuery.mockResolvedValueOnce({ ...makeQueryResult([]), rowCount: 1 });

      const result = await repo.delete("uuid-001");

      expect(result).toBe(true);
    });

    it("returns false when employee does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ ...makeQueryResult([]), rowCount: 0 });

      const result = await repo.delete("non-existent-id");

      expect(result).toBe(false);
    });

    it("issues a DELETE query with the correct id", async () => {
      mockQuery.mockResolvedValueOnce({ ...makeQueryResult([]), rowCount: 1 });

      await repo.delete("uuid-001");

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/DELETE FROM employees/i);
      expect(params).toContain("uuid-001");
    });
  });

  // ─── findByEmail ─────────────────────────────────────────────────────────────

  describe("findByEmail", () => {
    it("returns an employee matching the email", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([sampleEmployee]));

      const result = await repo.findByEmail("jane.doe@example.com");

      expect(result?.email).toBe("jane.doe@example.com");
    });

    it("returns null when email not found", async () => {
      mockQuery.mockResolvedValueOnce(makeQueryResult([]));

      const result = await repo.findByEmail("nobody@example.com");

      expect(result).toBeNull();
    });
  });
});
