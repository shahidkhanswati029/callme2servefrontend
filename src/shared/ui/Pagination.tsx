"use client";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-muted">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-xl border border-line bg-cream px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Prev
        </button>
        <span className="rounded-xl bg-mint px-3 py-1.5 font-semibold text-forest">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="rounded-xl border border-line bg-cream px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
