import { useState, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ReportForm } from "@/components/ReportForm";
import { StatsCards } from "@/components/StatsCards";
import { BreakdownGrid } from "@/components/BreakdownGrid";
import { ReportFeed } from "@/components/ReportFeed";
import { ResponsesChart } from "@/components/ResponsesChart";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { supabase } from "@/integrations/supabase/client";
import type { Report } from "@/lib/types";
import { countByStatus } from "@/lib/types";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .in("classification", ["selected", "not_selected"])
        .not("wage_level", "is", null)
        .not("education_level", "is", null)
        .order("created_utc", { ascending: false });

      if (error) throw error;
      setReports((data || []) as Report[]);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // Subscribe to realtime inserts
    const channel = supabase
      .channel("signals-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "signals" }, () => {
        fetchReports();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const counts = countByStatus(reports);
  const total = reports.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader isDemoMode={false} onRefresh={fetchReports} onToggleAdmin={() => {}} />

      <main className="container px-4 py-5 space-y-4 max-w-5xl">
        <ReportForm onSubmitted={fetchReports} />
        <DisclaimerBanner />
        <StatsCards selected={counts.selected} notSelected={counts.not_selected} total={total} />
        <BreakdownGrid reports={reports} />
        <ResponsesChart reports={reports} />
        <ReportFeed reports={reports} />
        {/* spacer for sticky bottom bar */}
        <div className="h-20" />
      </main>
      <StickyBottomBar />
    </div>
  );
}
