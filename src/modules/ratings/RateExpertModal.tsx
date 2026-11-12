"use client";

import { useEffect, useState } from "react";
import { ratingsApi } from "./api";

type Props = {
  expertId: string;
  expertName: string;
  jobId?: string;
  onClose: () => void;
  onSaved: (rating: number, ratingCount: number) => void;
};

export function RateExpertModal({ expertId, expertName, jobId, onClose, onSaved }: Props) {
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await ratingsApi.get(expertId);
        if (res.data.mine) {
          setStars(res.data.mine.stars);
          setText(res.data.mine.text || "");
        }
      } catch {
        // first rating
      }
    })();
  }, [expertId]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await ratingsApi.save({
        toAccountId: expertId,
        stars,
        text: text.trim() || undefined,
        jobId,
      });
      onSaved(res.data.account.rating, res.data.account.ratingCount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rating");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-cream p-5 shadow-[0_20px_50px_rgba(26,40,34,0.28)]">
        <h3 id="rate-title" className="font-display text-xl font-bold text-ink">
          Rate {expertName}
        </h3>
        <p className="mt-1 text-sm text-muted">
          Rate after the job is paid and completed
          {jobId ? " · linked to this job" : ""}.
        </p>

        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className={`h-10 w-10 rounded-xl text-lg font-bold ${
                n <= stars
                  ? "bg-brass text-forest"
                  : "border border-line bg-paper text-muted"
              }`}
              aria-label={`${n} stars`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="mt-4 min-h-[88px] w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          placeholder="Optional note"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />

        {error ? <p className="mt-2 text-sm font-semibold text-brass-deep">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
