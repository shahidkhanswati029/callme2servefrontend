export default function RootLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-paper px-4">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        <p className="mt-3 text-sm font-semibold text-muted">Loading…</p>
      </div>
    </div>
  );
}
