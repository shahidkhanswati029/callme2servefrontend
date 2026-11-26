export function LaptopChrome({
  panel,
  children,
  url = "callme2serve.com",
}: {
  panel: React.ReactNode;
  children: React.ReactNode;
  url?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(280px,420px)_1fr]">
      <aside className="hidden flex-col justify-between bg-forest p-8 text-paper lg:flex">
        {panel}
      </aside>
      <section className="flex w-full justify-center px-4 py-5 lg:px-12 lg:py-10">
        {/* Keep auth column capped so Google/Facebook hit targets stay full-width on desktop. */}
        <div className="w-full max-w-[430px]">
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
            {url}
          </p>
          <div className="animate-rise">{children}</div>
        </div>
      </section>
    </div>
  );
}
