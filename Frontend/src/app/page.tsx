"use client";
import { useState, useEffect, useCallback } from "react";
import { employeesApi } from "@/lib/api";
import type { Employee, PaginatedResult, EmployeeFilters, CreateEmployeeDTO } from "@/lib/types";
import EmployeeFiltersBar from "@/components/EmployeeFilters";
import EmployeeModal from "@/components/EmployeeModal";
import Pagination from "@/components/Pagination";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function StatTile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" }) {
  return (
    <div className="surface rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone === "accent" ? "text-[var(--brand)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default function EmployeesPage() {
  const [result, setResult] = useState<PaginatedResult<Employee> | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ open: boolean; employee?: Employee | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await employeesApi.list(filters);
      setResult(data);
    } catch {
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (dto: CreateEmployeeDTO) => {
    if (modal.employee) {
      await employeesApi.update(modal.employee.id, dto);
    } else {
      await employeesApi.create(dto);
    }
    await load();
  };

  const handleDelete = async (id: string) => {
    await employeesApi.delete(id);
    setDeleteId(null);
    await load();
  };

  const visibleEmployees = result?.data.length ?? 0;
  const totalPayroll = result?.data.reduce((sum, emp) => sum + emp.salary, 0) ?? 0;
  const avgVisibleSalary = visibleEmployees > 0 ? totalPayroll / visibleEmployees : 0;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--brand)] p-5 text-white shadow-sm sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">People directory</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Employees</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/74">
                Maintain compensation records, hiring dates, departments, and regional salary views.
              </p>
            </div>
            <button
              onClick={() => setModal({ open: true, employee: null })}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand)] shadow-sm transition hover:bg-[#f5eee1]"
            >
              Add Employee
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Total records" value={(result?.total ?? 0).toLocaleString()} tone="accent" />
          <StatTile label="This page" value={visibleEmployees.toLocaleString()} />
          <div className="col-span-2">
            <StatTile label="Avg visible salary" value={fmt.format(avgVisibleSalary)} />
          </div>
        </div>
      </section>

      <EmployeeFiltersBar filters={filters} onFiltersChange={setFilters} />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <section className="surface overflow-hidden rounded-xl">
        <div className="flex flex-col gap-1 border-b border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Compensation roster</h2>
            <p className="text-sm text-[var(--muted)]">
              {result ? `${result.page} of ${result.totalPages} pages` : "Loading roster"}
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--success)]">
            {fmt.format(totalPayroll)} visible payroll
          </span>
        </div>
        <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--panel-subtle)] text-left">
              {["Name", "Role", "Department", "Country", "Salary", "Hire Date", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-[var(--muted)]">
                  Loading roster...
                </td>
              </tr>
            ) : result?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-[var(--muted)]">
                  No employees found.
                </td>
              </tr>
            ) : (
              result?.data.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-[var(--line)]/70 transition-colors last:border-0 hover:bg-[var(--panel-subtle)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{emp.fullName}</div>
                    <div className="text-xs text-[var(--muted)]">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{emp.jobTitle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-[var(--line)] bg-[#fffdf8] px-2 py-1 text-xs font-semibold">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{emp.country}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--success)]">
                    {fmt.format(emp.salary)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{emp.hireDate.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setModal({ open: true, employee: emp })}
                        className="secondary-action px-3 py-1.5 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </section>

      {result && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {modal.open && (
        <EmployeeModal
          employee={modal.employee}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1f22]/45 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold">Delete employee?</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="secondary-action px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8f342b]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
