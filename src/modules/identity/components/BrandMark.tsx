export function BrandMark({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "mb-6"} ${className}`}>
      {/* Same mark used for favicon / tab icon (public/brand-mark.svg, app/icon.svg) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand-mark.svg"
        alt="CallMe2Serve"
        width={compact ? 40 : 48}
        height={compact ? 40 : 48}
        className={`shrink-0 rounded-[0.85rem] ${compact ? "h-10 w-10" : "h-12 w-12"}`}
      />
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
