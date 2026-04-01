import type { Report } from "@/lib/types";
import { countByStatus } from "@/lib/types";
import { LawFirmBreakdown } from "@/components/LawFirmBreakdown";

interface BreakdownGridProps {
  reports: Report[];
}

function BreakdownCard({ label, reports }: { label: string; reports: Report[] }) {
  const counts = countByStatus(reports);
  const total = reports.length;
  const selPct = total > 0 ? Math.round((counts.selected / total) * 100) : 0;

  return (
    <div className="stat-card">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{label}</div>
      {total === 0 ? (
        <div className="text-sm text-muted-foreground">No data</div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-2xl font-bold text-selected">{counts.selected}</span>
            <span className="text-2xl font-bold text-muted-foreground">|</span>
            <span className="text-2xl font-bold text-destructive">{counts.not_selected}</span>
          </div>
          <div className="text-xs text-muted-foreground mb-3">{selPct}% selection rate</div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
            <div className="bg-selected h-full transition-all" style={{ width: `${selPct}%` }} />
            <div className="bg-destructive h-full transition-all" style={{ width: `${100 - selPct}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

export function BreakdownGrid({ reports }: BreakdownGridProps) {
  // By Wage Level
  const byLevel: Record<string, Report[]> = { "1": [], "2": [], "3": [], "4": [] };
  reports.forEach(r => {
    if (r.wage_level && byLevel[r.wage_level]) byLevel[r.wage_level].push(r);
  });

  // By Education
  const byEdu: Record<string, Report[]> = { Masters: [], Bachelors: [], Other: [] };
  reports.forEach(r => {
    if (r.education_level && byEdu[r.education_level]) byEdu[r.education_level].push(r);
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">By Wage Level</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(byLevel).map(([level, reps]) => (
            <BreakdownCard key={level} label={`Level ${level}`} reports={reps} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">By Education</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(byEdu).map(([edu, reps]) => (
            <BreakdownCard key={edu} label={edu === "Masters" ? "Master's" : edu === "Bachelors" ? "Bachelor's" : edu} reports={reps} />
          ))}
        </div>
      </div>
    </div>
  );
}
