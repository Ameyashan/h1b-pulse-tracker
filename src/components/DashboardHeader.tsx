import { RefreshCw, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isDemoMode: boolean;
  onRefresh: () => void;
  onToggleAdmin: () => void;
}

export function DashboardHeader({ isDemoMode, onRefresh, onToggleAdmin }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">
            H1B<span className="text-primary">Pulse</span>
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">FY2026 Lottery Tracker</span>
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="text-xs border border-accent/40 text-accent px-2.5 py-1 rounded-md font-medium">
              Demo Mode
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleAdmin} className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
