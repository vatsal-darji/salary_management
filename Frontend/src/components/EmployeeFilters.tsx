"use client";
import { useState } from "react";
import type { EmployeeFilters } from "@/lib/types";

interface Props {
  filters: EmployeeFilters;
  onFiltersChange: (f: EmployeeFilters) => void;
}

export default function EmployeeFilters({ filters, onFiltersChange }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");

  const set = (key: keyof EmployeeFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value || undefined, page: 1 });

  return (
    <section className="surface mb-5 rounded-xl p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1.4fr)_minmax(140px,0.8fr)_minmax(160px,0.9fr)_140px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Search
          </span>
          <input
            type="text"
            placeholder="Name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && set("search", search)}
            onBlur={() => set("search", search)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Country
          </span>
          <input
            type="text"
            placeholder="All countries"
            value={filters.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Department
          </span>
          <input
            type="text"
            placeholder="All departments"
            value={filters.department ?? ""}
            onChange={(e) => set("department", e.target.value)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Rows
          </span>
          <select
            value={filters.pageSize ?? 20}
            onChange={(e) => onFiltersChange({ ...filters, pageSize: Number(e.target.value), page: 1 })}
            className="field"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
