import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ReportForm } from "@/components/ReportForm";
import { StatsCards } from "@/components/StatsCards";
import { BreakdownGrid } from "@/components/BreakdownGrid";
import { ReportFeed } from "@/components/ReportFeed";
import { ResponsesChart } from "@/components/ResponsesChart";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { PetitionTrackerTab } from "@/components/PetitionTrackerTab";
import { PetitionCTABanner } from "@/components/PetitionCTABanner";
import { NextStepsTab } from "@/components/NextStepsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Report } from "@/lib/types";
import { countByStatus } from "@/lib/types";

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);

  const TAB_MAP: Record<string, string> = { "/": "lottery", "/next-steps": "nextsteps", "/petition-tracker": "petition" };
  const PATH_MAP: Record<string, string> = { lottery: "/", nextsteps: "/next-steps", petition: "/petition-tracker" };
  const activeTab = useMemo(() => TAB_MAP[location.pathname] || "lottery", [location.pathname]);

  const handleTabChange = (value: string) => {
    const path = PATH_MAP[value] || "/";
    if (location.pathname !== path) navigate(path, { replace: true });
  };

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
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => {
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="lottery" className="text-xs sm:text-sm font-semibold px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">🎲 </span>Lottery
              <span className="hidden sm:inline"> Tracker</span>
            </TabsTrigger>
            <TabsTrigger value="nextsteps" className="text-xs sm:text-sm font-semibold px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">🗺️ </span>Next Steps
            </TabsTrigger>
            <TabsTrigger value="petition" className="text-xs sm:text-sm font-semibold px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">📋 </span>Petition
              <span className="hidden sm:inline"> Tracker</span>
              <span className="ml-1 text-[9px] sm:text-[10px] font-bold rounded-full bg-primary/15 text-primary px-1.5 sm:px-2 py-0.5 leading-none">
                Apr 4
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lottery" className="space-y-4">
            <PetitionCTABanner onNavigate={() => handleTabChange("petition")} />
            <ReportForm onSubmitted={fetchReports} />
            <DisclaimerBanner />
            <StatsCards selected={counts.selected} notSelected={counts.not_selected} total={total} />
            <BreakdownGrid reports={reports} />
            <ResponsesChart reports={reports} />
            <ReportFeed reports={reports} />
            <div className="h-20" />
          </TabsContent>

          <TabsContent value="nextsteps">
            <NextStepsTab />
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
