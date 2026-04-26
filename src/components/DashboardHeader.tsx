import { RefreshCw, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-custom";

const REGISTER_VISITOR_URL =
  "https://rkwcpnoqnxporjqqlxjt.supabase.co/functions/v1/register-visitor";

function useTotalVisitors() {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "visitor_count")
      .single();
    if (data) setCount(Number(data.value));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REGISTER_VISITOR_URL, { method: "POST" });
        if (res.ok) {
          const body = await res.json();
          if (!cancelled && typeof body.count === "number") {
            setCount(body.count);
            return;
          }
        }
      } catch {
        // fall through to read-only refresh
      }
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { count, refresh };
}

interface DashboardHeaderProps {
  isDemoMode: boolean;
  onRefresh: () => void;
  onToggleAdmin: () => void;
}

export function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const { count: totalVisitors, refresh: refreshVisitors } = useTotalVisitors();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14 px-4 max-w-5xl">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">
            H1B<span className="text-primary">Pulse</span>
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">FY2027 Lottery Tracker</span>
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totalVisitors !== null && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-semibold">{totalVisitors.toLocaleString()}</span>
              <span className="hidden sm:inline">friends helping each other</span>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => { onRefresh(); refreshVisitors(); }} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
