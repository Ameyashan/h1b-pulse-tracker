import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NewsTicker } from "@/components/redesign/NewsTicker";
import { AppHeader, type TabKey } from "@/components/redesign/AppHeader";
import { PulseAITab } from "@/components/redesign/PulseAITab";
import { LotteryTab } from "@/components/redesign/LotteryTab";
import { PetitionTab } from "@/components/redesign/PetitionTab";
import { NextStepsTab } from "@/components/redesign/NextStepsTab";
import { DS160GuideTab } from "@/components/redesign/DS160GuideTab";
import { DS160SeasonBanner } from "@/components/redesign/DS160SeasonBanner";
import { IntroVideoModal } from "@/components/IntroVideoModal";

const PATH_TO_TAB: Record<string, TabKey> = {
  "/": "pulse",
  "/pulse": "pulse",
  "/lottery-tracker": "lottery",
  "/petition-tracker": "petition",
  "/ds-160": "ds160",
  "/next-steps": "steps",
};

const TAB_TO_PATH: Record<TabKey, string> = {
  pulse: "/",
  lottery: "/lottery-tracker",
  petition: "/petition-tracker",
  ds160: "/ds-160",
  steps: "/next-steps",
};

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo<TabKey>(
    () => PATH_TO_TAB[location.pathname] ?? "pulse",
    [location.pathname]
  );

  const handleTabChange = (tab: TabKey) => {
    const path = TAB_TO_PATH[tab];
    if (location.pathname !== path) navigate(path, { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <IntroVideoModal />
      <DS160SeasonBanner
        onOpen={() => handleTabChange("ds160")}
        hideOnTab={activeTab === "ds160"}
      />
      <NewsTicker />
      <AppHeader activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="rd-main">
        {activeTab === "pulse" && <PulseAITab />}
        {activeTab === "lottery" && <LotteryTab />}
        {activeTab === "petition" && <PetitionTab />}
        {activeTab === "ds160" && <DS160GuideTab />}
        {activeTab === "steps" && <NextStepsTab />}
      </main>
    </div>
  );
}
