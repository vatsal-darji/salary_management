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

const CHART_COLORS = ["#145a54", "#c06a45", "#5b6f8c", "#9a6a34", "#6a6256"];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-3 mt-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
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
      <div className="surface flex h-64 items-center justify-center rounded-xl text-[var(--muted)]">
        Loading insights...
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
        {error}
      </p>
    );
  }

  const totalEmployees = countryStats.reduce((s, c) => s + c.employeeCount, 0);
  const overallAvg =
    countryStats.length > 0
      ? countryStats.reduce((s, c) => s + c.avgSalary * c.employeeCount, 0) / totalEmployees
      : 0;
  const maxSalary = countryStats.reduce((m, c) => Math.max(m, c.maxSalary), 0);
  const minSalary = countryStats.reduce((m, c) => Math.min(m, c.minSalary), Infinity);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--line)] bg-[#1c1f22] p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/60">Analytics</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Salary Insights</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
          Understand compensation ranges by country, department, and salary band.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalEmployees.toLocaleString()} />
        <StatCard label="Overall Avg Salary" value={fmt.format(overallAvg)} />
        <StatCard label="Highest Salary" value={fmt.format(maxSalary)} />
        <StatCard label="Lowest Salary" value={fmt.format(minSalary === Infinity ? 0 : minSalary)} />
      </div>

      <SectionHeader
        title="Average Salary by Country"
        detail="Top countries ranked by mean compensation."
      />
      <section className="surface rounded-xl p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={countryStats.slice(0, 15)}
            margin={{ top: 10, right: 20, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ded1" />
            <XAxis
              dataKey="country"
              tick={{ fontSize: 11, fill: "#6f6b63" }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#6f6b63" }}
            />
            <Tooltip formatter={(v) => (typeof v === "number" ? fmt.format(v) : v)} />
            <Bar dataKey="avgSalary" name="Avg Salary" fill="#145a54" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="surface table-scroll rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--panel-subtle)] text-left">
              {["Country", "Employees", "Min", "Avg", "Max"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countryStats.map((row) => (
              <tr key={row.country} className="border-b border-[var(--line)]/70 last:border-0 hover:bg-[var(--panel-subtle)]">
                <td className="px-4 py-3 font-semibold">{row.country}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{row.employeeCount}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{fmt.format(row.minSalary)}</td>
                <td className="px-4 py-3 font-semibold text-[var(--brand)]">{fmt.format(row.avgSalary)}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{fmt.format(row.maxSalary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SectionHeader
        title="Average Salary by Department"
        detail="Department-level benchmark for compensation planning."
      />
      <section className="surface rounded-xl p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={deptStats}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ded1" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#6f6b63" }}
            />
            <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: "#6f6b63" }} width={110} />
            <Tooltip formatter={(v) => (typeof v === "number" ? fmt.format(v) : v)} />
            <Bar dataKey="avgSalary" name="Avg Salary" fill="#c06a45" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <SectionHeader
        title="Salary Distribution"
        detail="Headcount share across compensation bands."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="surface rounded-xl p-4">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="range"
                cx="50%"
                cy="44%"
                innerRadius={58}
                outerRadius={94}
                paddingAngle={2}
              >
                {distribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="square"
                wrapperStyle={{ color: "#4a4640", fontSize: 13, paddingTop: 16 }}
              />
              <Tooltip formatter={(v) => `${v} employees`} />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="surface overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel-subtle)] text-left">
                {["Range", "Employees", "% of Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {distribution.map((row, i) => (
                <tr key={row.range} className="border-b border-[var(--line)]/70 last:border-0 hover:bg-[var(--panel-subtle)]">
                  <td className="flex items-center gap-2 px-4 py-3">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {row.range}
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
