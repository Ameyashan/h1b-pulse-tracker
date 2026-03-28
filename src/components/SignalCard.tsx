import { ChevronDown, ChevronUp, ExternalLink, ArrowUp } from "lucide-react";
import { useState } from "react";
import type { Signal, SignalClassification } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";

function ClassBadge({ classification }: { classification: SignalClassification }) {
  const map: Record<SignalClassification, { label: string; className: string }> = {
    selected: { label: "Selected", className: "status-badge-selected" },
    not_selected: { label: "Not Selected", className: "status-badge-not-selected" },
    waiting: { label: "Waiting", className: "status-badge-waiting" },
    noise: { label: "Noise", className: "bg-muted text-muted-foreground border border-border" },
  };
  const { label, className } = map[classification];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

export function SignalCard({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const timeAgo = getTimeAgo(new Date(signal.created_utc));

  return (
    <div className="signal-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <ClassBadge classification={signal.classification} />
          {signal.flair && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              {signal.flair}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span>{timeAgo}</span>
          <span className="flex items-center gap-0.5">
            <ArrowUp className="h-3 w-3" /> {signal.score}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-sm mb-1.5">{signal.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {expanded ? signal.body : signal.body.slice(0, 150) + (signal.body.length > 150 ? "..." : "")}
      </p>

      {signal.body.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        {signal.employer_mentions.length > 0 &&
          signal.employer_mentions.map(emp => (
            <Badge key={emp} variant="secondary" className="text-xs">{emp}</Badge>
          ))
        }
        <a
          href={signal.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-0.5 ml-auto"
        >
          {signal.author} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
