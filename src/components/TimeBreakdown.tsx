import { DonutChart } from "./DonutChart";
import type { Signal } from "@/lib/demo-data";
import { getSignalsByTimeWindow, countByClassification } from "@/lib/demo-data";

interface TimeBreakdownProps {
  signals: Signal[];
}

function TimeCard({ label, signals }: { label: string; signals: Signal[] }) {
  const counts = countByClassification(signals);
  const total = signals.filter(s => s.classification !== "noise").length;
  const showChart = total > 0;

  return (
    <div className="stat-card">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{label}</div>
      <div className="flex items-center gap-4">
        {showChart && (
          <DonutChart selected={counts.selected} notSelected={counts.not_selected} waiting={counts.waiting} size={72} />
        )}
        <div className="flex-1 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-selected" /> Selected
            </span>
            <span className="font-semibold text-selected">{counts.selected}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Not Selected
            </span>
            <span className="font-semibold text-destructive">{counts.not_selected}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> Waiting
            </span>
            <span className="font-semibold text-accent">{counts.waiting}</span>
          </div>
          <div className="flex justify-between text-muted-foreground text-xs pt-1 border-t border-border">
            <span>Total signals</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimeBreakdown({ signals }: TimeBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <TimeCard label="Last 1 Hour" signals={getSignalsByTimeWindow(signals, 1)} />
      <TimeCard label="Last 6 Hours" signals={getSignalsByTimeWindow(signals, 6)} />
      <TimeCard label="Last 24 Hours" signals={getSignalsByTimeWindow(signals, 24)} />
    </div>
  );
}
