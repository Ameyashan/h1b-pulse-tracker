import { useState, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ReportForm } from "@/components/ReportForm";
import { StatsCards } from "@/components/StatsCards";
import { BreakdownGrid } from "@/components/BreakdownGrid";
import { ReportFeed } from "@/components/ReportFeed";
import { ResponsesChart } from "@/components/ResponsesChart";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { PetitionTrackerTab } from "@/components/PetitionTrackerTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Report } from "@/lib/types";
import { countByStatus } from "@/lib/types";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);

  const fetchReports = useCallback(async () => {
    try {
      const PAGE_SIZE = 1000;
      let allData: Report[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("signals")
          .select("*")
          .in("classification", ["selected", "not_selected"])
          .not("wage_level", "is", null)
          .not("education_level", "is", null)
          .order("created_utc", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        const rows = (data || []) as Report[];
        allData = allData.concat(rows);
        hasMore = rows.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      setReports(allData);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
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

      <main className="container px-4 py-5 max-w-5xl">
        <Tabs defaultValue="lottery" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="lottery" className="text-sm font-semibold">
              🎲 Lottery Tracker
            </TabsTrigger>
            <TabsTrigger value="petition" className="text-sm font-semibold">
              📋 Petition Tracker
              <span className="ml-1.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary px-2 py-0.5 leading-none">
                Apr 4
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lottery" className="space-y-4">
            <ReportForm onSubmitted={fetchReports} />
            <DisclaimerBanner />
            <StatsCards selected={counts.selected} notSelected={counts.not_selected} total={total} />
            <BreakdownGrid reports={reports} />
            <ResponsesChart reports={reports} />
            <ReportFeed reports={reports} />
            <div className="h-20" />
          </TabsContent>

          <TabsContent value="petition">
            <PetitionTrackerTab />
          </TabsContent>
        </Tabs>
      </main>
      <StickyBottomBar />
    </div>
  );
}
