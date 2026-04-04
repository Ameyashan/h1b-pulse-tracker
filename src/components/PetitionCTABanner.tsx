import { ArrowRight } from "lucide-react";

interface PetitionCTABannerProps {
  onNavigate: () => void;
}

export function PetitionCTABanner({ onNavigate }: PetitionCTABannerProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-r from-card to-card/80 p-4 sm:p-5 flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground text-sm sm:text-base">
          Selected in the FY2027 lottery?
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Track your petition from filing to approval. Anonymous and crowdsourced.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="shrink-0 h-10 sm:h-11 px-4 sm:px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
      >
        Log My Petition
        <ArrowRight className="w-4 h-4 hidden sm:block" />
      </button>
    </div>
  );
}
