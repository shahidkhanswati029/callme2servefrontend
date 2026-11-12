"use client";

/** Lightweight SVG charts — no heavy chart library (keeps dashboards fast). */

export function BarChart({
  points,
  valueKey = "value",
  labelKey = "label",
  color = "var(--forest)",
  height = 180,
}: {
  points: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
  color?: string;
  height?: number;
}) {
  const max = Math.max(...points.map((p) => Number(p[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {points.map((p, i) => {
        const v = Number(p[valueKey]) || 0;
        const h = Math.max(4, (v / max) * 100);
        return (
          <div key={`${p[labelKey]}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[0.65rem] font-semibold text-ink">{v}</span>
            <div
              className="w-full rounded-t-md transition-[height]"
              style={{ height: `${h}%`, background: color, minHeight: 4 }}
              title={`${p[labelKey]}: ${v}`}
            />
            <span className="max-w-full truncate text-[0.55rem] text-muted">{String(p[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  slices,
  size = 160,
  centerLabel,
}: {
  slices: Array<{ label: string; value: number; color: string }>;
  size?: number;
  centerLabel?: string;
}) {
  const total = Math.max(
    slices.reduce((s, x) => s + Math.abs(x.value), 0),
    1,
  );
  let angle = -90;
  const paths = slices.map((slice) => {
    const sweep = (Math.abs(slice.value) / total) * 360;
    const start = angle;
    angle += sweep;
    return { ...slice, start, sweep };
  });

  function arc(startDeg: number, sweepDeg: number) {
    const r = 42;
    const cx = 50;
    const cy = 50;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(startDeg + sweepDeg));
    const y2 = cy + r * Math.sin(toRad(startDeg + sweepDeg));
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
        {paths.map((p) =>
          p.sweep <= 0 ? null : (
            <path key={p.label} d={arc(p.start, Math.max(p.sweep, 0.01))} fill={p.color} />
          ),
        )}
        <circle cx="50" cy="50" r="24" fill="var(--cream)" />
        {centerLabel ? (
          <text
            x="50"
            y="52"
            textAnchor="middle"
            fontSize="7"
            fontWeight="700"
            fill="var(--ink)"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>
      <ul className="grid gap-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted">{s.label}</span>
            <strong className="ml-auto">{s.value.toLocaleString()}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineSpark({
  values,
  color = "var(--brass)",
  height = 64,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Filled area + line for multi-day series. */
export function AreaChart({
  points,
  valueKey = "value",
  labelKey = "label",
  color = "var(--forest)",
  height = 180,
}: {
  points: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
  color?: string;
  height?: number;
}) {
  const values = points.map((p) => Number(p[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const n = Math.max(points.length, 1);
  const coords = values.map((v, i) => {
    const x = n <= 1 ? 0 : (i / (n - 1)) * 100;
    const y = 100 - (v / max) * 92;
    return { x, y, v, label: String(points[i]?.[labelKey] ?? "") };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
        <polygon points={area} fill={color} opacity="0.18" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="1.4" fill={color}>
            <title>
              {c.label}: {c.v}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[0.55rem] text-muted">
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2) ? (
            <span key={i}>{String(p[labelKey])}</span>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}

export function StackedBars({
  points,
  series,
  height = 180,
}: {
  points: Array<{ label: string } & Record<string, number | string>>;
  series: Array<{ key: string; color: string; label: string }>;
  height?: number;
}) {
  const max = Math.max(
    ...points.map((p) => series.reduce((s, ser) => s + (Number(p[ser.key]) || 0), 0)),
    1,
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {points.map((p, i) => {
          const total = series.reduce((s, ser) => s + (Number(p[ser.key]) || 0), 0);
          return (
            <div key={`${p.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[0.65rem] font-semibold text-ink">{total}</span>
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-md"
                style={{ height: `${Math.max(4, (total / max) * 100)}%`, minHeight: 4 }}
                title={`${p.label}: ${total}`}
              >
                {series.map((ser) => {
                  const v = Number(p[ser.key]) || 0;
                  if (!v) return null;
                  return (
                    <div
                      key={ser.key}
                      style={{
                        height: `${(v / Math.max(total, 1)) * 100}%`,
                        background: ser.color,
                        minHeight: 2,
                      }}
                    />
                  );
                })}
              </div>
              <span className="max-w-full truncate text-[0.55rem] text-muted">{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
