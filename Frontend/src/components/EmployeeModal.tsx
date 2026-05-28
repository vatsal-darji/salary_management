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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4">
        <h2 className="text-lg font-semibold mb-4">
          {employee ? "Edit Employee" : "Add Employee"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
            <div key={key} className={span === 2 ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                required
                min={key === "salary" ? 0 : undefined}
                value={form[key] as string | number}
                onChange={(e) =>
                  set(key, type === "number" ? Number(e.target.value) : e.target.value)
                }
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {error && (
            <p className="col-span-2 text-red-600 text-sm">{error}</p>
          )}

          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
