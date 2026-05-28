import type { IEmployeeRepository } from "./employee.repository.interface";
import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResult,
  EmployeeFilters,
} from "./employees.types";

export class EmployeeService {
  constructor(private repo: IEmployeeRepository) {}

  async list(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
    return this.repo.findAll(filters);
  }

  async getById(id: string): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) throw new Error(`Employee not found: ${id}`);
    return employee;
  }

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    if (dto.salary < 0) throw new Error("Salary must be non-negative");
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new Error(`Email already in use: ${dto.email}`);
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    if (dto.salary !== undefined && dto.salary < 0) {
      throw new Error("Salary must be non-negative");
    }
    const result = await this.repo.update(id, dto);
    if (!result) throw new Error(`Employee not found: ${id}`);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Employee not found: ${id}`);
    return deleted;
  }
}
