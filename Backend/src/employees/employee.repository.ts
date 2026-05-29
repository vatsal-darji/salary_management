import { Pool } from "pg";
import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResult,
  EmployeeFilters,
} from "./employees.types";
import type { IEmployeeRepository } from "./employee.repository.interface";
import { buildWhere } from "../db/queryHelpers";

type DbRow = {
  id: string;
  full_name: string;
  job_title: string;
  country: string;
  salary: string;
  department: string;
  email: string;
  hire_date: Date;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: DbRow): Employee {
  return {
    id: row.id,
    fullName: row.full_name,
    jobTitle: row.job_title,
    country: row.country,
    salary: parseFloat(row.salary),
    department: row.department,
    email: row.email,
    hireDate: row.hire_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DB_FIELD_MAP: Record<keyof CreateEmployeeDTO, string> = {
  fullName: "full_name",
  jobTitle: "job_title",
  country: "country",
  salary: "salary",
  department: "department",
  email: "email",
  hireDate: "hire_date",
};

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private pool: Pool) {}

  async findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const { where, params } = buildWhere([
      filters.country    ? { col: "country",    value: filters.country }                      : null,
      filters.department ? { col: "department", value: filters.department }                   : null,
      filters.jobTitle   ? { col: "job_title",  value: filters.jobTitle }                     : null,
      filters.search     ? { col: "full_name",  value: `%${filters.search}%`, operator: "ILIKE" } : null,
    ]);

    const countResult = await this.pool.query(
      `SELECT COUNT(*) AS total FROM employees ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, pageSize, offset];
    const dataResult = await this.pool.query(
      `SELECT * FROM employees ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams,
    );

    return {
      data: dataResult.rows.map(mapRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Employee | null> {
    const result = await this.pool.query(
      "SELECT * FROM employees WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    const result = await this.pool.query(
      `INSERT INTO employees (full_name, job_title, country, salary, department, email, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        dto.fullName,
        dto.jobTitle,
        dto.country,
        dto.salary,
        dto.department,
        dto.email,
        dto.hireDate,
      ],
    );
    return mapRow(result.rows[0]);
  }

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, col] of Object.entries(DB_FIELD_MAP)) {
      if (dto[key as keyof UpdateEmployeeDTO] !== undefined) {
        params.push(dto[key as keyof UpdateEmployeeDTO]);
        setClauses.push(`${col} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) return null;

    params.push(id);
    const result = await this.pool.query(
      `UPDATE employees SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM employees WHERE id = $1",
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const result = await this.pool.query(
      "SELECT * FROM employees WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }
}
