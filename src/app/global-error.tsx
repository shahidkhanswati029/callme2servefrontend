"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Root-level failure (replaces the root layout). Keep self-contained + animated.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CallMe2Serve global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 min-h-screen bg-[#f6f1e7] text-[#1a2822] antialiased">
        <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(224,154,43,0.2), transparent 60%)",
              animation: "cmts-fade 0.5s ease both",
            }}
          />
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#d3c7b6] bg-[#fffcf8] shadow-[0_24px_60px_rgba(26,40,34,0.14)]"
            style={{ animation: "cmts-scale 0.45s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1b3c33] via-[#e09a2b] to-[#1b3c33]" />
            <div className="p-8">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#8c5a0c]">
                Critical error
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight">
                CallMe2Serve couldn’t load
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#4a5c54]">
                {error.message ||
                  "A serious client error stopped the app. Retry — if it continues, refresh the browser."}
              </p>
              {error.digest ? (
                <p className="mt-3 font-mono text-[0.65rem] text-[#4a5c54]">{error.digest}</p>
              ) : null}
              <button
                type="button"
                onClick={reset}
                className="mt-7 rounded-xl bg-[#1b3c33] px-5 py-3 text-sm font-semibold text-[#f6f1e7]"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes cmts-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes cmts-scale { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: none } }
        `}</style>
      </body>
    </html>
  );
}
