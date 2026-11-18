export default function RootLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-paper px-4">
      <div className="animate-scale text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-forest" />
        <p className="animate-rise mt-4 text-sm font-semibold text-muted [animation-delay:80ms]">
          Loading CallMe2Serve…
        </p>
      </div>
    </div>
  );
}
