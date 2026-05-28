import type { InsightsRepository } from "./insights.repository";
import type {
  CountrySalaryStats,
  DepartmentSalaryStats,
  JobTitleSalaryStats,
  SalaryDistribution,
  InsightsFilters,
} from "./insights.types";

export class InsightsService {
  constructor(private repo: InsightsRepository) {}

  getByCountry(filters?: InsightsFilters): Promise<CountrySalaryStats[]> {
    return this.repo.getByCountry(filters);
  }

  getByDepartment(filters?: InsightsFilters): Promise<DepartmentSalaryStats[]> {
    return this.repo.getByDepartment(filters);
  }

  getByJobTitle(filters?: InsightsFilters): Promise<JobTitleSalaryStats[]> {
    return this.repo.getByJobTitle(filters);
  }

  getSalaryDistribution(filters?: InsightsFilters): Promise<SalaryDistribution[]> {
    return this.repo.getSalaryDistribution(filters);
  }
}
