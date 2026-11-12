export function BrandMark({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "mb-6"} ${className}`}>
      <div
        className={`relative grid place-items-center rounded-[0.85rem] bg-forest text-paper ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <span className={`font-bold ${compact ? "text-base" : "text-lg"}`}>C</span>
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-sm bg-brass" />
      </div>
      <div>
        <h1
          className={`font-display font-bold leading-none text-ink ${
            compact ? "text-lg" : "text-2xl"
          }`}
        >
          CallMe
        </h1>
        <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.16em] text-muted">
          2SERVE
        </p>
      </div>
    </div>
  );
}
