interface DonutChartProps {
  selected: number;
  notSelected: number;
  waiting: number;
  size?: number;
}

export function DonutChart({ selected, notSelected, waiting, size = 80 }: DonutChartProps) {
  const total = selected + notSelected + waiting;
  if (total === 0) return <div style={{ width: size, height: size }} className="rounded-full border-2 border-border" />;

  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;

  const segments = [
    { value: selected, color: "hsl(var(--selected))" },
    { value: notSelected, color: "hsl(var(--not-selected))" },
    { value: waiting, color: "hsl(var(--waiting))" },
  ];

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}
