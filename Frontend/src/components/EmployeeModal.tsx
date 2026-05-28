"use client";
import { useState, useEffect } from "react";
import type { Employee, CreateEmployeeDTO } from "@/lib/types";

interface Props {
  employee?: Employee | null;
  onClose: () => void;
  onSave: (data: CreateEmployeeDTO) => Promise<void>;
}

const EMPTY: CreateEmployeeDTO = {
  fullName: "",
  jobTitle: "",
  country: "",
  salary: 0,
  department: "",
  email: "",
  hireDate: "",
};

export default function EmployeeModal({ employee, onClose, onSave }: Props) {
  const [form, setForm] = useState<CreateEmployeeDTO>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        fullName: employee.fullName,
        jobTitle: employee.jobTitle,
        country: employee.country,
        salary: employee.salary,
        department: employee.department,
        email: employee.email,
        hireDate: employee.hireDate.slice(0, 10),
      });
    } else {
      setForm(EMPTY);
    }
  }, [employee]);

  const set = (key: keyof CreateEmployeeDTO, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1f22]/45 p-4 backdrop-blur-sm">
      <div className="surface w-full max-w-2xl rounded-xl">
        <div className="border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Employee record
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {employee ? "Edit employee" : "Add employee"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {(
            [
              { key: "fullName", label: "Full Name", type: "text", span: 2 },
              { key: "email", label: "Email", type: "email", span: 2 },
              { key: "jobTitle", label: "Job Title", type: "text", span: 1 },
              { key: "department", label: "Department", type: "text", span: 1 },
              { key: "country", label: "Country", type: "text", span: 1 },
              { key: "salary", label: "Salary (USD)", type: "number", span: 1 },
              { key: "hireDate", label: "Hire Date", type: "date", span: 1 },
            ] as { key: keyof CreateEmployeeDTO; label: string; type: string; span: 1 | 2 }[]
          ).map(({ key, label, type, span }) => (
            <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {label}
              </label>
              <input
                type={type}
                required
                min={key === "salary" ? 0 : undefined}
                value={form[key] as string | number}
                onChange={(e) =>
                  set(key, type === "number" ? Number(e.target.value) : e.target.value)
                }
                className="field"
              />
            </div>
          ))}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--danger)] sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="secondary-action px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-action px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
