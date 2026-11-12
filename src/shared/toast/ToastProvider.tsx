"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: string; kind: ToastKind; message: string };
type ToastContextValue = {
  push: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(
    () => ({
      push,
      success: (m: string) => push(m, "success"),
      error: (m: string) => push(m, "error"),
      info: (m: string) => push(m, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-[110] grid w-[min(360px,calc(100vw-2rem))] gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-rise overflow-hidden rounded-[0.85rem] border border-line bg-cream text-[0.92rem] font-semibold text-ink shadow-[0_16px_40px_rgba(26,40,34,0.16)]`}
          >
            <div
              className={`h-1 w-full ${
                t.kind === "success"
                  ? "bg-success"
                  : t.kind === "error"
                    ? "bg-brass"
                    : "bg-forest"
              }`}
            />
            <div
              className={`px-4 py-3 ${
                t.kind === "success"
                  ? "text-forest"
                  : t.kind === "error"
                    ? "text-brass-deep"
                    : "text-muted"
              }`}
            >
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
