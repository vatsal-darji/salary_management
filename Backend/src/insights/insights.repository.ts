import { Pool } from "pg";
import type {
  CountrySalaryStats,
  DepartmentSalaryStats,
  JobTitleSalaryStats,
  SalaryDistribution,
  InsightsFilters,
} from "./insights.types";
import { buildWhere } from "../db/queryHelpers";

export class InsightsRepository {
  constructor(private pool: Pool) {}

  async getByCountry(filters: InsightsFilters = {}): Promise<CountrySalaryStats[]> {
    const { where, params } = buildWhere([
      filters.department ? { col: "department", value: filters.department } : null,
      filters.jobTitle   ? { col: "job_title",  value: filters.jobTitle }   : null,
    ]);
    const result = await this.pool.query(
      `SELECT
         country,
         MIN(salary)::float  AS "minSalary",
         MAX(salary)::float  AS "maxSalary",
         AVG(salary)::float  AS "avgSalary",
         COUNT(*)::int       AS "employeeCount"
       FROM employees
       ${where}
       GROUP BY country
       ORDER BY "avgSalary" DESC`,
      params,
    );
    return result.rows;
  }

  async getByDepartment(filters: InsightsFilters = {}): Promise<DepartmentSalaryStats[]> {
    const { where, params } = buildWhere([
      filters.country  ? { col: "country",   value: filters.country }  : null,
      filters.jobTitle ? { col: "job_title", value: filters.jobTitle } : null,
    ]);
    const result = await this.pool.query(
      `SELECT
         department,
         MIN(salary)::float  AS "minSalary",
         MAX(salary)::float  AS "maxSalary",
         AVG(salary)::float  AS "avgSalary",
         COUNT(*)::int       AS "employeeCount"
       FROM employees
       ${where}
       GROUP BY department
       ORDER BY "avgSalary" DESC`,
      params,
    );
    return result.rows;
  }

  async getByJobTitle(filters: InsightsFilters = {}): Promise<JobTitleSalaryStats[]> {
    const { where, params } = buildWhere([
      filters.country    ? { col: "country",    value: filters.country }    : null,
      filters.department ? { col: "department", value: filters.department } : null,
    ]);
    const result = await this.pool.query(
      `SELECT
         job_title  AS "jobTitle",
         country,
         MIN(salary)::float  AS "minSalary",
         MAX(salary)::float  AS "maxSalary",
         AVG(salary)::float  AS "avgSalary",
         COUNT(*)::int       AS "employeeCount"
       FROM employees
       ${where}
       GROUP BY job_title, country
       ORDER BY "avgSalary" DESC`,
      params,
    );
    return result.rows;
  }

  async getSalaryDistribution(filters: InsightsFilters = {}): Promise<SalaryDistribution[]> {
    const { where, params } = buildWhere([
      filters.country    ? { col: "country",    value: filters.country }    : null,
      filters.department ? { col: "department", value: filters.department } : null,
    ]);
    const result = await this.pool.query(
      `WITH classified AS (
         SELECT
           CASE
             WHEN salary < 30000  THEN 1
             WHEN salary < 60000  THEN 2
             WHEN salary < 100000 THEN 3
             WHEN salary < 150000 THEN 4
             ELSE                      5
           END AS sort_order
         FROM employees ${where}
       ),
       ranges AS (
         SELECT 1 AS sort_order, '< 30k'     AS range
         UNION ALL SELECT 2, '30k–60k'
         UNION ALL SELECT 3, '60k–100k'
         UNION ALL SELECT 4, '100k–150k'
         UNION ALL SELECT 5, '150k+'
       ),
       total AS (SELECT COUNT(*)::float AS total FROM employees ${where})
       SELECT
         r.range,
         COUNT(c.sort_order)::int                                            AS count,
         ROUND((COUNT(c.sort_order) * 100.0 / t.total)::numeric, 2)::float  AS percentage
       FROM ranges r
       JOIN classified c ON c.sort_order = r.sort_order
       CROSS JOIN total t
       GROUP BY r.range, r.sort_order, t.total
       ORDER BY r.sort_order`,
      params,
    );
    return result.rows;
  }
}
