export interface Employee {
  id: string;
  fullName: string;
  jobTitle: string;
  country: string;
  salary: number;
  department: string;
  email: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeFilters {
  country?: string;
  department?: string;
  jobTitle?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeDTO {
  fullName: string;
  jobTitle: string;
  country: string;
  salary: number;
  department: string;
  email: string;
  hireDate: string;
}

export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO>;

export interface CountrySalaryStats {
  country: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  employeeCount: number;
}

export interface DepartmentSalaryStats {
  department: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  employeeCount: number;
}

export interface JobTitleSalaryStats {
  jobTitle: string;
  country: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  employeeCount: number;
}

export interface SalaryDistribution {
  range: string;
  count: number;
  percentage: number;
}
