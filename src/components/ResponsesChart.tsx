import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Report } from "@/lib/types";

interface ResponsesChartProps {
  reports: Report[];
}

export function ResponsesChart({ reports }: ResponsesChartProps) {
  const data = useMemo(() => {
    if (reports.length === 0) return [];

    // Sort by time
    const sorted = [...reports].sort(
      (a, b) => new Date(a.created_utc).getTime() - new Date(b.created_utc).getTime()
    );

    // Bucket into ~30 time bins
    const first = new Date(sorted[0].created_utc).getTime();
    const last = new Date(sorted[sorted.length - 1].created_utc).getTime();
    const range = last - first || 1;
    const bucketCount = Math.min(30, sorted.length);
    const bucketSize = range / bucketCount;

    let selCum = 0;
    let notCum = 0;
    let idx = 0;

    const points: { time: number; label: string; Selected: number; "Not Selected": number }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bucketEnd = first + (i + 1) * bucketSize;
      while (idx < sorted.length && new Date(sorted[idx].created_utc).getTime() <= bucketEnd) {
        if (sorted[idx].classification === "selected") selCum++;
        else notCum++;
        idx++;
      }
      const d = new Date(bucketEnd);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      points.push({ time: bucketEnd, label, Selected: selCum, "Not Selected": notCum });
    }

    return points;
  }, [reports]);

  if (data.length < 2) return null;

  return (
    <div className="stat-card">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Responses Over Time
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSelected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradNotSelected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="Selected"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth={2}
              fill="url(#gradSelected)"
            />
            <Area
              type="monotone"
              dataKey="Not Selected"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fill="url(#gradNotSelected)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
