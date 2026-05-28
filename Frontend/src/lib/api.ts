import type {
  Employee,
  PaginatedResult,
  EmployeeFilters,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  CountrySalaryStats,
  DepartmentSalaryStats,
  JobTitleSalaryStats,
  SalaryDistribution,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

// ─── Employees ───────────────────────────────────────────────────────────────

export const employeesApi = {
  list(filters: EmployeeFilters = {}): Promise<PaginatedResult<Employee>> {
    return apiFetch(`/employees${toQuery(filters as Record<string, string | number | undefined>)}`);
  },

  getById(id: string): Promise<Employee> {
    return apiFetch(`/employees/${id}`);
  },

  create(dto: CreateEmployeeDTO): Promise<Employee> {
    return apiFetch("/employees", { method: "POST", body: JSON.stringify(dto) });
  },

  update(id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    return apiFetch(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
  },

  delete(id: string): Promise<void> {
    return apiFetch(`/employees/${id}`, { method: "DELETE" });
  },
};

// ─── Insights ────────────────────────────────────────────────────────────────

export const insightsApi = {
  byCountry(params: { department?: string; jobTitle?: string } = {}): Promise<CountrySalaryStats[]> {
    return apiFetch(`/insights/by-country${toQuery(params)}`);
  },

  byDepartment(params: { country?: string; jobTitle?: string } = {}): Promise<DepartmentSalaryStats[]> {
    return apiFetch(`/insights/by-department${toQuery(params)}`);
  },

  byJobTitle(params: { country?: string; department?: string } = {}): Promise<JobTitleSalaryStats[]> {
    return apiFetch(`/insights/by-job-title${toQuery(params)}`);
  },

  distribution(params: { country?: string; department?: string } = {}): Promise<SalaryDistribution[]> {
    return apiFetch(`/insights/distribution${toQuery(params)}`);
  },
};
