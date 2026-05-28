import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResult,
  EmployeeFilters,
} from "./employees.types";

export interface IEmployeeRepository {
  findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>>;
  findById(id: string): Promise<Employee | null>;
  create(dto: CreateEmployeeDTO): Promise<Employee>;
  update(id: string, dto: UpdateEmployeeDTO): Promise<Employee | null>;
  delete(id: string): Promise<boolean>;
  findByEmail(email: string): Promise<Employee | null>;
}
