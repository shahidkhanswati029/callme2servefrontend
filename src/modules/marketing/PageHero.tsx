export function PageHero({
  eyebrow,
  title,
  lede,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  /** Tighter padding so page content clears the first viewport. */
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 animate-fade"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(224,154,43,0.28), transparent 55%)",
        }}
      />
      <div
        className={`relative mx-auto max-w-6xl px-4 sm:px-6 ${
          compact ? "py-8 sm:py-10" : "py-12 sm:py-16"
        }`}
      >
        <p className="animate-rise text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brass">
          {eyebrow}
        </p>
        <h1
          className={`animate-rise font-display mt-2 max-w-3xl font-bold leading-tight [animation-delay:80ms] ${
            compact
              ? "text-[clamp(1.7rem,3.5vw,2.6rem)]"
              : "text-[clamp(2rem,4vw,3.2rem)]"
          }`}
        >
          {title}
        </h1>
        <p className="animate-rise mt-3 max-w-2xl text-sm leading-relaxed text-[#d5e0d8] sm:text-base [animation-delay:140ms]">
          {lede}
        </p>
      </div>
      <svg
        className="relative block w-full text-paper"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path fill="currentColor" d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" />
      </svg>
    </section>
  );
}
