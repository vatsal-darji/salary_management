"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Employees" },
  { href: "/insights", label: "Insights" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#fffdf8]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white shadow-sm">
            CL
          </span>
          <div>
            <span className="block text-base font-semibold tracking-[0.01em] text-[var(--foreground)]">
              CompLedger
            </span>
            <span className="hidden text-xs text-[var(--muted)] sm:block">
              Salary operations
            </span>
          </div>
        </div>
        <div className="flex rounded-lg border border-[var(--line)] bg-[var(--panel-subtle)] p-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
                pathname === href
                  ? "bg-[var(--panel)] text-[var(--brand)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
