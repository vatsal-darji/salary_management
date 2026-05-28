"use client";
import { useState, useEffect } from "react";
import { insightsApi } from "@/lib/api";
import type {
  CountrySalaryStats,
  DepartmentSalaryStats,
  SalaryDistribution,
} from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold mb-4 mt-8">{title}</h2>;
}

export default function InsightsPage() {
  const [countryStats, setCountryStats] = useState<CountrySalaryStats[]>([]);
  const [deptStats, setDeptStats] = useState<DepartmentSalaryStats[]>([]);
  const [distribution, setDistribution] = useState<SalaryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      insightsApi.byCountry(),
      insightsApi.byDepartment(),
      insightsApi.distribution(),
    ])
      .then(([c, d, dist]) => {
        setCountryStats(c);
        setDeptStats(d);
        setDistribution(dist);
      })
      .catch(() => setError("Failed to load insights."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
    );
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  const totalEmployees = countryStats.reduce((s, c) => s + c.employeeCount, 0);
  const overallAvg =
    countryStats.length > 0
      ? countryStats.reduce((s, c) => s + c.avgSalary * c.employeeCount, 0) / totalEmployees
      : 0;
  const maxSalary = countryStats.reduce((m, c) => Math.max(m, c.maxSalary), 0);
  const minSalary = countryStats.reduce((m, c) => Math.min(m, c.minSalary), Infinity);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Salary Insights</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={totalEmployees.toLocaleString()} />
        <StatCard label="Overall Avg Salary" value={fmt.format(overallAvg)} />
        <StatCard label="Highest Salary" value={fmt.format(maxSalary)} />
        <StatCard label="Lowest Salary" value={fmt.format(minSalary === Infinity ? 0 : minSalary)} />
      </div>

      {/* Salary by Country */}
      <SectionHeader title="Average Salary by Country" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={countryStats.slice(0, 15)}
            margin={{ top: 10, right: 20, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="country"
              tick={{ fontSize: 11 }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(v) => (typeof v === "number" ? fmt.format(v) : v)} />
            <Bar dataKey="avgSalary" name="Avg Salary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Country table */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              {["Country", "Employees", "Min", "Avg", "Max"].map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countryStats.map((row) => (
              <tr key={row.country} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{row.country}</td>
                <td className="px-4 py-2 text-gray-600">{row.employeeCount}</td>
                <td className="px-4 py-2 text-gray-600">{fmt.format(row.minSalary)}</td>
                <td className="px-4 py-2 font-medium text-blue-700">{fmt.format(row.avgSalary)}</td>
                <td className="px-4 py-2 text-gray-600">{fmt.format(row.maxSalary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Salary by Department */}
      <SectionHeader title="Average Salary by Department" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={deptStats}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={110} />
            <Tooltip formatter={(v) => (typeof v === "number" ? fmt.format(v) : v)} />
            <Bar dataKey="avgSalary" name="Avg Salary" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Salary Distribution */}
      <SectionHeader title="Salary Distribution" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="range"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {distribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(v) => `${v} employees`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                {["Range", "Employees", "% of Total"].map((h) => (
                  <th key={h} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distribution.map((row, i) => (
                <tr key={row.range} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {row.range}
                  </td>
                  <td className="px-4 py-2 font-medium">{row.count.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-600">{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
