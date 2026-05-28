"use client";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="secondary-action px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            p === page
              ? "bg-[var(--brand)] text-white shadow-sm"
              : "border border-[var(--line)] bg-[#fffdf8] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="secondary-action px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
