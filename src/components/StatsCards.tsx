import { CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";

interface StatsCardsProps {
  selected: number;
  notSelected: number;
  waiting: number;
  total: number;
  lastUpdated: string;
}

export function StatsCards({ selected, notSelected, waiting, total, lastUpdated }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected (24H)</span>
          <CheckCircle2 className="h-4 w-4 text-selected" />
        </div>
        <div className="text-3xl font-bold text-selected">{selected}</div>
        <div className="text-xs text-muted-foreground mt-1">{total > 0 ? Math.round((selected / total) * 100) : 0}% of signals</div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Not Selected (24H)</span>
          <XCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="text-3xl font-bold text-destructive">{notSelected}</div>
        <div className="text-xs text-muted-foreground mt-1">rejection reports</div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Still Waiting (24H)</span>
          <Clock className="h-4 w-4 text-accent" />
        </div>
        <div className="text-3xl font-bold text-accent">{waiting}</div>
        <div className="text-xs text-muted-foreground mt-1">pending reports</div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Signals</span>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold text-foreground">{total}</div>
        <div className="text-xs text-muted-foreground mt-1">Last: {lastUpdated}</div>
      </div>
    </div>
  );
}
