export function Loader({
  label = "Loading…",
  full = false,
}: {
  label?: string;
  full?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        full ? "min-h-screen" : "py-10"
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-forest" />
      <p className="text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}

export function ButtonLoader({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 ${
        dark
          ? "border-forest/20 border-t-forest"
          : "border-white/30 border-t-white"
      }`}
    />
  );
}
