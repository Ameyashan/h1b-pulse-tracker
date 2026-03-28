import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

export function StickyBottomBar() {
  const [email, setEmail] = useState("");

  const handleNotify = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("You'll be notified when petition tracking launches!");
    setEmail("");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground leading-tight">
              Petition tracking launches April 1
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              Track your filing status, RFEs, and processing times
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNotify()}
            className="flex-1 sm:w-56 h-10 rounded-lg border border-border/60 bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleNotify}
            className="h-10 px-5 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors whitespace-nowrap"
          >
            Notify me
          </button>
        </div>
      </div>
    </div>
  );
}
