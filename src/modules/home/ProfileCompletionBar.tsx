import type { PublicAccount } from "@/modules/identity/types";

export function ProfileCompletionBar({ account }: { account: PublicAccount }) {
  const pieces = account.profilePieces?.length
    ? account.profilePieces
    : [
        { key: "name", label: "Name", done: Boolean(account.name) },
        { key: "work", label: "Work", done: Boolean(account.work) },
        { key: "photo", label: "Photo", done: Boolean(account.photoUrl) },
        {
          key: "place",
          label: "Place",
          done: Boolean(account.placeLabel || account.city),
        },
        { key: "payout", label: "Payout account", done: account.payoutAccountSet },
      ];
  const done = pieces.filter((p) => p.done).length;
  const percent = account.profilePercent ?? Math.round((done / 5) * 100);

  return (
    <section className="animate-rise mb-4 rounded-2xl border border-line bg-cream p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
            Profile
          </p>
          <h2 className="font-display text-xl font-bold text-ink">{account.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {account.placeLabel || account.city || "Place not set"}
            {account.rating ? ` · ${account.rating.toFixed(1)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <strong className="font-display block text-2xl text-brass-deep">{percent}%</strong>
          <span className="text-xs text-muted">
            {done} of 5 done{!account.payoutAccountSet ? " · payout open" : ""}
          </span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#efeae0]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest to-success transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {pieces.map((p) => (
          <li
            key={p.key}
            className="flex items-center justify-between gap-2 rounded-lg bg-paper px-2 py-1.5 text-xs"
          >
            <span>{p.label}</span>
            <em
              className={`not-italic font-bold ${
                p.done ? "text-success" : "text-brass-deep"
              }`}
            >
              {p.done ? "Done" : "Open"}
            </em>
          </li>
        ))}
      </ul>
    </section>
  );
}
