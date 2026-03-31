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
import { cacheReports, getCachedReports, STATIC_FALLBACK_SUMMARY } from "@/lib/fallback-data";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackType, setFallbackType] = useState<"cache" | "static" | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const PAGE_SIZE = 1000;
      let allData: Report[] = [];
      let from = 0;
      let hasMore = true;

      // Add a timeout to detect hung connections
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 10000)
      );

      while (hasMore) {
        const queryPromise = supabase
          .from("signals")
          .select("*")
          .in("classification", ["selected", "not_selected"])
          .not("wage_level", "is", null)
          .not("education_level", "is", null)
          .order("created_utc", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) throw error;
        const rows = (data || []) as Report[];
        allData = allData.concat(rows);
        hasMore = rows.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      // Guard: if we get 0 results, check for fallbacks before accepting
      if (allData.length === 0) {
        const cached = getCachedReports();
        if (cached && cached.length > 0) {
          setReports(cached);
          setUsingFallback(true);
          setFallbackType("cache");
          return;
        }
        // No cache either — use static fallback
        setUsingFallback(true);
        setFallbackType("static");
        return;
      }

      setReports(allData);
      setUsingFallback(false);
      setFallbackType(null);
      cacheReports(allData);
    } catch (err) {
      console.error("Error fetching reports:", err);
      // Fallback 1: localStorage cache
      const cached = getCachedReports();
      if (cached && cached.length > 0) {
        setReports(cached);
        setUsingFallback(true);
        setFallbackType("cache");
        return;
      }
      // Fallback 2: static snapshot
      setUsingFallback(true);
      setFallbackType("static");
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

    // Retry every 30s if using fallback
    const retryInterval = setInterval(() => {
      if (document.hidden) return;
      fetchReports();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(retryInterval);
    };
  }, [fetchReports]);

  const counts = usingFallback && fallbackType === "static"
    ? { selected: STATIC_FALLBACK_SUMMARY.selected, not_selected: STATIC_FALLBACK_SUMMARY.notSelected }
    : countByStatus(reports);
  const total = usingFallback && fallbackType === "static"
    ? STATIC_FALLBACK_SUMMARY.total
    : reports.length;

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
            {usingFallback && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  {fallbackType === "cache"
                    ? "Showing cached data — live connection is temporarily unavailable. Auto-retrying…"
                    : "Showing last known summary — live connection is temporarily unavailable. Auto-retrying…"}
                </span>
              </div>
            )}
            <ReportForm onSubmitted={fetchReports} />
            <DisclaimerBanner />
            <StatsCards selected={counts.selected} notSelected={counts.not_selected} total={total} />
            {fallbackType !== "static" && <BreakdownGrid reports={reports} />}
            {fallbackType !== "static" && <ResponsesChart reports={reports} />}
            {fallbackType !== "static" && <ReportFeed reports={reports} />}
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
