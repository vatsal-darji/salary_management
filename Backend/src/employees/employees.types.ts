export interface Employee {
  id: string;
  fullName: string;
  jobTitle: string;
  country: string;
  salary: number;
  department: string;
  email: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmployeeDTO = Omit<
  Employee,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeFilters {
  country?: string;
  jobTitle?: string;
  department?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
