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
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && set("search", search)}
        onBlur={() => set("search", search)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Country"
        value={filters.country ?? ""}
        onChange={(e) => set("country", e.target.value)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Department"
        value={filters.department ?? ""}
        onChange={(e) => set("department", e.target.value)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={filters.pageSize ?? 20}
        onChange={(e) => onFiltersChange({ ...filters, pageSize: Number(e.target.value), page: 1 })}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {[10, 20, 50].map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
      </select>
    </div>
  );
}
