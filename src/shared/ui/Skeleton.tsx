export function Skeleton({
  height = 16,
  width = "100%",
  radius = 8,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: radius }}
    />
  );
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto grid min-h-screen max-w-[920px] gap-4 p-5">
      <Skeleton height={28} width="55%" />
      <Skeleton height={72} radius={14} />
      <Skeleton height={220} radius={16} />
      <Skeleton height={64} radius={14} />
      <Skeleton height={64} radius={14} />
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="mx-auto grid max-w-md gap-4 p-6">
      <Skeleton height={48} width={48} radius={14} />
      <Skeleton height={28} width="50%" />
      <Skeleton height={52} radius={14} />
      <Skeleton height={52} radius={14} />
    </div>
  );
}
