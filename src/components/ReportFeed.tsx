import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Report, ReportStatus } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

function ReportRow({ report }: { report: Report }) {
  const isSelected = report.classification === "selected";
  const timeAgo = getTimeAgo(new Date(report.created_utc));

  return (
    <div className="signal-card flex items-center gap-4">
      <div className={`shrink-0 p-2 rounded-full ${isSelected ? "bg-selected/15" : "bg-destructive/15"}`}>
        {isSelected ? (
          <CheckCircle2 className="h-5 w-5 text-selected" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${isSelected ? "text-selected" : "text-destructive"}`}>
            {isSelected ? "Selected" : "Not Selected"}
          </span>
          {report.wage_level && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              Level {report.wage_level}
            </span>
          )}
          {report.education_level && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              {report.education_level === "Masters" ? "Master's" : report.education_level === "Bachelors" ? "Bachelor's" : report.education_level}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
    </div>
  );
}

interface ReportFeedProps {
  reports: Report[];
}

export function ReportFeed({ reports }: ReportFeedProps) {
  const [filter, setFilter] = useState<"all" | ReportStatus>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [eduFilter, setEduFilter] = useState<string>("all");

  const filtered = reports
    .filter(r => filter === "all" || r.classification === filter)
    .filter(r => levelFilter === "all" || r.wage_level === levelFilter)
    .filter(r => eduFilter === "all" || r.education_level === eduFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="not_selected">Not Selected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eduFilter} onValueChange={setEduFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Education</SelectItem>
              <SelectItem value="Masters">Master's</SelectItem>
              <SelectItem value="Bachelors">Bachelor's</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map(report => (
          <ReportRow key={report.id} report={report} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No reports yet. Be the first to submit!
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
