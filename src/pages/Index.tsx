import { useState, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCards } from "@/components/StatsCards";
import { TimeBreakdown } from "@/components/TimeBreakdown";
import { SignalFeed } from "@/components/SignalFeed";
import { AdminPanel } from "@/components/AdminPanel";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { DEMO_SIGNALS, getSignalsByTimeWindow, countByClassification } from "@/lib/demo-data";
import type { Signal } from "@/lib/demo-data";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

export default function Index() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [signals, setSignals] = useState<Signal[]>(DEMO_SIGNALS);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .neq("classification", "noise")
        .order("created_utc", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        setSignals(data.map(d => ({
          ...d,
          employer_mentions: d.employer_mentions || [],
        })) as Signal[]);
        setIsDemoMode(false);
      }
    } catch (err) {
      console.error("Error fetching signals:", err);
      // Stay in demo mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchSignals, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const signals24h = getSignalsByTimeWindow(signals, 24);
  const counts24h = countByClassification(signals24h);
  const total24h = signals24h.filter(s => s.classification !== "noise").length;

  const lastSignal = signals[0];
  const lastUpdated = lastSignal
    ? getTimeAgo(new Date(lastSignal.created_utc))
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader isDemoMode={isDemoMode} onRefresh={fetchSignals} onToggleAdmin={() => setAdminOpen(true)} />

      <main className="container px-4 py-5 space-y-4 max-w-6xl">
        {isDemoMode && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-accent">Demo Mode active.</strong> Showing synthetic data.
              To go live: register a Reddit app at{" "}
              <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                reddit.com/prefs/apps
              </a>
              , then set{" "}
              <code className="bg-secondary px-1 rounded text-accent">REDDIT_CLIENT_ID</code> and{" "}
              <code className="bg-secondary px-1 rounded text-accent">REDDIT_CLIENT_SECRET</code> in your environment and turn off Demo Mode in{" "}
              <button onClick={() => setAdminOpen(true)} className="text-primary underline">Admin</button>.
            </p>
          </div>
        )}

        <DisclaimerBanner />
        <StatsCards
          selected={counts24h.selected}
          notSelected={counts24h.not_selected}
          waiting={counts24h.waiting}
          total={total24h}
          lastUpdated={lastUpdated}
        />
        <TimeBreakdown signals={signals} />
        <SignalFeed signals={signals} />
      </main>

      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
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
