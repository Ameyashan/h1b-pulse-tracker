import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Disclaimer:</strong> H1B Pulse aggregates crowd-sourced signals from Reddit r/h1b. This is not affiliated with or endorsed by USCIS. Always verify your selection status directly at{" "}
        <a href="https://myuscis.gov" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          myUSCIS.gov
        </a>.
      </p>
    </div>
  );
}
