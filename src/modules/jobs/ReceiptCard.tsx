"use client";

export type PaymentReceipt = {
  id: string;
  receiptNo: string;
  jobId: string;
  askerId: string;
  workerId: string;
  askerName: string;
  workerName: string;
  quotation: number;
  visitFee: number;
  total: number;
  packageRate: number;
  commission: number;
  netToWorker: number;
  currency: string;
  rail: string;
  payNote: string | null;
  packageTier: string | null;
  createdAt: string;
};

/** Matches CallMeToServe receipt SVG frame — real ledger figures only. */
export function ReceiptCard({
  receipt,
  onClose,
}: {
  receipt: PaymentReceipt;
  onClose?: () => void;
}) {
  const money = (n: number) =>
    `${receipt.currency} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_20px_50px_rgba(26,40,34,0.2)]">
      <div className="bg-forest px-5 py-4 text-paper">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brass">
          Receipt · CallMe2Serve
        </p>
        <h3 className="font-display mt-1 text-2xl font-bold">{receipt.receiptNo}</h3>
        <p className="mt-1 text-sm text-[#d5e0d8]">
          {new Date(receipt.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="grid gap-3 px-5 py-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Asker</span>
          <strong>{receipt.askerName}</strong>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Worker</span>
          <strong>{receipt.workerName}</strong>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Quotation</span>
          <span>{money(receipt.quotation)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Visit fee</span>
          <span>{money(receipt.visitFee)}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-3">
          <span className="font-semibold">Together</span>
          <strong>{money(receipt.total)}</strong>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">
            {receipt.packageTier || "Package"} {receipt.packageRate}% kept
          </span>
          <span className="text-brass-deep">{money(receipt.commission)}</span>
        </div>
        <div className="rounded-xl bg-mint px-3 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brass-deep">
            Worker receives
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-forest">
            {money(receipt.netToWorker)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Paid with {receipt.rail}
            {receipt.payNote ? ` · ${receipt.payNote}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted">
          Silver/Gold/Platinum monthly fees are separate package rows — not inside this job
          payout. Desk releases the waiting net to the worker.
        </p>
      </div>
      {onClose ? (
        <div className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}
