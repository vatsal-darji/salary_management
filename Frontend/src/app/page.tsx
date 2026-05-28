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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          {result && (
            <p className="text-sm text-gray-500 mt-0.5">
              {result.total.toLocaleString()} total
            </p>
          )}
        </div>
        <button
          onClick={() => setModal({ open: true, employee: null })}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Employee
        </button>
      </div>

      <EmployeeFiltersBar filters={filters} onFiltersChange={setFilters} />

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              {["Name", "Job Title", "Department", "Country", "Salary", "Hire Date", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide"
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
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : result?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              result?.data.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.jobTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.country}</td>
                  <td className="px-4 py-3 font-medium text-green-700">
                    {fmt.format(emp.salary)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.hireDate.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setModal({ open: true, employee: emp })}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="text-red-500 hover:underline text-xs"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete employee?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
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
