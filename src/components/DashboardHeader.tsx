import { RefreshCw, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function usePresenceCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = crypto.randomUUID();
    const channel = supabase.channel("online-users", {
      config: { presence: { key: id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

interface DashboardHeaderProps {
  isDemoMode: boolean;
  onRefresh: () => void;
  onToggleAdmin: () => void;
}

export function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const onlineCount = usePresenceCount();

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
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary font-semibold">{onlineCount}</span> friends helping each other
          </span>
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
