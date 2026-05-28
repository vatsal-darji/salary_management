import { EmployeeService } from "../../src/employees/employee.service";
import { IEmployeeRepository } from "../../src/employees/employee.repository.interface";
import {
  Employee,
  CreateEmployeeDTO,
} from "../../src/employees/employees.types";

const sampleEmployee: Employee = {
  id: "uuid-001",
  fullName: "Jane Doe",
  jobTitle: "Software Engineer",
  country: "India",
  salary: 95000,
  department: "Engineering",
  email: "jane.doe@example.com",
  hireDate: new Date("2022-03-15"),
  createdAt: new Date("2022-03-15"),
  updatedAt: new Date("2022-03-15"),
};

const mockRepo: jest.Mocked<IEmployeeRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
};

describe("EmployeeService", () => {
  let service: EmployeeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeeService(mockRepo);
  });

  // ─── list ───────────────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns paginated employees from the repository", async () => {
      const paginated = {
        data: [sampleEmployee],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      mockRepo.findAll.mockResolvedValueOnce(paginated);

      const result = await service.list({});

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockRepo.findAll).toHaveBeenCalledWith({});
    });
  });

  // ─── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns the employee when found", async () => {
      mockRepo.findById.mockResolvedValueOnce(sampleEmployee);

      const result = await service.getById("uuid-001");

      expect(result).toEqual(sampleEmployee);
    });

    it("throws when employee does not exist", async () => {
      mockRepo.findById.mockResolvedValueOnce(null);

      await expect(service.getById("bad-id")).rejects.toThrow(/not found/i);
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

    it("creates employee when email is unique", async () => {
      mockRepo.findByEmail.mockResolvedValueOnce(null);
      mockRepo.create.mockResolvedValueOnce(sampleEmployee);

      const result = await service.create(dto);

      expect(result).toEqual(sampleEmployee);
      expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
    });

    it("throws when email is already in use", async () => {
      mockRepo.findByEmail.mockResolvedValueOnce(sampleEmployee);

      await expect(service.create(dto)).rejects.toThrow(/email/i);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("throws when salary is negative", async () => {
      await expect(service.create({ ...dto, salary: -1 })).rejects.toThrow(
        /salary/i,
      );
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("returns updated employee on success", async () => {
      const updated = { ...sampleEmployee, salary: 110000 };
      mockRepo.update.mockResolvedValueOnce(updated);

      const result = await service.update("uuid-001", { salary: 110000 });

      expect(result.salary).toBe(110000);
    });

    it("throws when employee does not exist", async () => {
      mockRepo.update.mockResolvedValueOnce(null);

      await expect(service.update("bad-id", { salary: 50000 })).rejects.toThrow(
        /not found/i,
      );
    });

    it("throws when updating salary to a negative value", async () => {
      await expect(
        service.update("uuid-001", { salary: -500 }),
      ).rejects.toThrow(/salary/i);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("returns true when employee is deleted", async () => {
      mockRepo.delete.mockResolvedValueOnce(true);

      const result = await service.delete("uuid-001");

      expect(result).toBe(true);
    });

    it("throws when employee does not exist", async () => {
      mockRepo.delete.mockResolvedValueOnce(false);

      await expect(service.delete("bad-id")).rejects.toThrow(/not found/i);
    });
  });
});
