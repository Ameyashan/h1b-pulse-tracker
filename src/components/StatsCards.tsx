import { CheckCircle2, XCircle } from "lucide-react";

interface StatsCardsProps {
  selected: number;
  notSelected: number;
  total: number;
}

export function StatsCards({ selected, notSelected, total }: StatsCardsProps) {
  const selPct = total > 0 ? Math.round((selected / total) * 100) : 0;
  const notPct = total > 0 ? Math.round((notSelected / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected</span>
          <CheckCircle2 className="h-4 w-4 text-selected" />
        </div>
        <div className="text-3xl font-bold text-selected">{selected}</div>
        <div className="text-xs text-muted-foreground mt-1">{selPct}% of reports</div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Not Selected</span>
          <XCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="text-3xl font-bold text-destructive">{notSelected}</div>
        <div className="text-xs text-muted-foreground mt-1">{notPct}% of reports</div>
      </div>

      <div className="stat-card col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Reports</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{total}</div>
        {/* Selection rate bar */}
        {total > 0 && (
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden flex">
            <div className="bg-selected h-full transition-all" style={{ width: `${selPct}%` }} />
            <div className="bg-destructive h-full transition-all" style={{ width: `${notPct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
