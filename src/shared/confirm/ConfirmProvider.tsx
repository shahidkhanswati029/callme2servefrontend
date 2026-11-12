"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
    setOptions(null);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && options ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Dismiss"
            onClick={() => close(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_20px_50px_rgba(26,40,34,0.28)]">
            <div
              className={`h-1.5 w-full ${
                options.tone === "danger" ? "bg-brass" : "bg-forest"
              }`}
            />
            <div className="p-5">
              <h3 id="confirm-title" className="font-display text-xl font-bold text-ink">
                {options.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{options.message}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-mint"
                >
                  {options.cancelLabel || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-paper ${
                    options.tone === "danger"
                      ? "bg-brass-deep hover:opacity-95"
                      : "bg-forest hover:opacity-95"
                  }`}
                >
                  {options.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
