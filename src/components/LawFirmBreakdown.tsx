import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Report } from "@/lib/types";
import { countByStatus } from "@/lib/types";

interface LawFirmBreakdownProps {
  reports: Report[];
}

interface FirmData {
  name: string;
  total: number;
  selected: number;
  notSelected: number;
  selectionRate: number;
}

function FirmCard({ firm }: { firm: FirmData }) {
  return (
    <div className="stat-card">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 truncate">{firm.name}</div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-2xl font-bold text-selected">{firm.selected}</span>
        <span className="text-2xl font-bold text-muted-foreground">|</span>
        <span className="text-2xl font-bold text-destructive">{firm.notSelected}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-1">{firm.selectionRate}% selection rate</div>
      <div className="text-xs text-muted-foreground mb-3">{firm.total} reports</div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
        <div className="bg-selected h-full transition-all" style={{ width: `${firm.selectionRate}%` }} />
        <div className="bg-destructive h-full transition-all" style={{ width: `${100 - firm.selectionRate}%` }} />
      </div>
    </div>
  );
}

function RateBadge({ rate }: { rate: number }) {
  const color = rate >= 60 ? "bg-selected/20 text-selected" : rate >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-destructive/20 text-destructive";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{rate}%</span>;
}

export function LawFirmBreakdown({ reports }: LawFirmBreakdownProps) {
  const [search, setSearch] = useState("");

  const firms = useMemo(() => {
    const map: Record<string, Report[]> = {};
    reports.forEach((r) => {
      const firm = (r as any).law_firm;
      if (firm && typeof firm === "string" && firm.trim()) {
        const key = firm.trim();
        if (!map[key]) map[key] = [];
        map[key].push(r);
      }
    });
    const result: FirmData[] = Object.entries(map).map(([name, reps]) => {
      const counts = countByStatus(reps);
      const total = reps.length;
      return {
        name,
        total,
        selected: counts.selected,
        notSelected: counts.not_selected,
        selectionRate: total > 0 ? Math.round((counts.selected / total) * 100) : 0,
      };
    });
    result.sort((a, b) => b.total - a.total);
    return result;
  }, [reports]);

  const top4 = firms.slice(0, 4);
  const filtered = search
    ? firms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : firms;
  const totalFirms = firms.length;

  if (firms.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Announcement Banner */}
      <div className="stat-card border border-purple-500/30 bg-purple-500/5">
        <p className="text-sm text-muted-foreground">
          <span className="text-purple-400 font-semibold">🚀 New:</span>{" "}
          We now track selection results by law firm. Report your law firm above to help the community see which firms have sent notifications. Data updates in real time.
        </p>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          By Law Firm
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-500/20 text-purple-400">
            NEW
          </span>
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search law firm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 rounded-md border border-border bg-secondary pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Top 4 Cards */}
      {top4.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {top4.map((firm) => (
            <FirmCard key={firm.name} firm={firm} />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Law Firm</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reports</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Not Selected</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Selection Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((firm) => (
                <tr key={firm.name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground">{firm.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{firm.total}</td>
                  <td className="py-2.5 px-3 text-selected font-semibold">{firm.selected}</td>
                  <td className="py-2.5 px-3 text-destructive font-semibold">{firm.notSelected}</td>
                  <td className="py-2.5 px-3 text-right"><RateBadge rate={firm.selectionRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center py-3 text-xs text-muted-foreground border-t border-border">
          Showing top {Math.min(filtered.length, 20)} firms by report volume · {totalFirms} firms tracked · Report yours above to add data
        </div>
      </div>
    </div>
  );
}
