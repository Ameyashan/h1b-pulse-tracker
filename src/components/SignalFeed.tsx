import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignalCard } from "./SignalCard";
import type { Signal, SignalClassification } from "@/lib/demo-data";

interface SignalFeedProps {
  signals: Signal[];
}

export function SignalFeed({ signals }: SignalFeedProps) {
  const [filter, setFilter] = useState<"all" | SignalClassification>("all");
  const [search, setSearch] = useState("");

  const filtered = signals
    .filter(s => s.classification !== "noise")
    .filter(s => filter === "all" || s.classification === filter)
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q) || s.author.toLowerCase().includes(q);
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Signal Feed</h2>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All signals</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="not_selected">Not Selected</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-card border-border"
            />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(signal => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No signals match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
