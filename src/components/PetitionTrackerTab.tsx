import { useState } from "react";
import { ClipboardList, Bell, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PetitionTrackerTab() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("notification_emails")
        .insert({ email: email.trim() });
      if (error) throw error;
      toast.success("You'll be notified when petition tracking launches!");
      setEmail("");
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to save email:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Petition Tracker
          </h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <CalendarClock className="w-4 h-4" />
            Launching April 4, 2025
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Track your H-1B petition filing status, monitor RFE responses, and get real-time processing time updates — all in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Filing Status", desc: "Track your petition progress" },
            { label: "RFE Tracking", desc: "Monitor RFE responses" },
            { label: "Processing Times", desc: "Real-time service center data" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="rounded-lg border border-border/60 bg-card p-3 text-left"
            >
              <p className="font-semibold text-foreground text-xs">{feature.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium py-3">
            <Bell className="w-4 h-4" />
            You're on the list! We'll notify you at launch.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Get notified when it's live
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNotify()}
                className="flex-1 h-11 rounded-lg border border-border/60 bg-muted/40 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleNotify}
                disabled={loading}
                className="h-11 px-6 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-sm transition-colors whitespace-nowrap"
              >
                {loading ? "..." : "Notify me"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
