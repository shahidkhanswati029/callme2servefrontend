export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(224,154,43,0.28), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brass">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d5e0d8] sm:text-base">{lede}</p>
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
