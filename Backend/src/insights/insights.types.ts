export interface CountrySalaryStats {
  country: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  employeeCount: number;
}

export interface JobTitleSalaryStats {
  jobTitle: string;
  country: string;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
}

export interface DepartmentSalaryStats {
  department: string;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  employeeCount: number;
}

export interface SalaryDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface InsightsFilters {
  country?: string;
  jobTitle?: string;
  department?: string;
}
