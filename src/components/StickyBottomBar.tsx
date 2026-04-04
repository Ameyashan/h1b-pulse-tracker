import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

const EMOJIS = [
  { value: 5, emoji: "😀", label: "Love it" },
  { value: 4, emoji: "🙂", label: "Like it" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 2, emoji: "🙁", label: "Dislike" },
  { value: 1, emoji: "😞", label: "Hate it" },
];

export function StickyBottomBar() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const location = useLocation();

  const pageName = location.pathname === "/" ? "Lottery Tracker"
    : location.pathname.includes("next-steps") ? "Next Steps"
    : location.pathname.includes("petition") ? "Petition Tracker"
    : location.pathname;

  const handleSend = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        rating,
        message: message.trim() || null,
        page: pageName,
      });
      if (error) throw error;
      toast.success("Thanks for your feedback!");
      setRating(null);
      setMessage("");
      setOpen(false);
    } catch {
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border/60 shadow-lg hover:bg-muted/60 transition-colors text-sm font-semibold text-foreground"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {/* Feedback modal */}
      {open && (
        <div className="fixed bottom-16 right-5 z-50 w-80 rounded-2xl border border-border/60 bg-card shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground text-base">Send feedback</h3>
              <p className="text-xs text-muted-foreground">Page: {pageName}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-foreground/80">
            How was your experience? Optional note helps us improve.
          </p>

          {/* Emoji rating */}
          <div className="flex gap-3">
            {EMOJIS.map((e) => (
              <button
                key={e.value}
                onClick={() => setRating(e.value)}
                className={`text-2xl transition-transform hover:scale-125 ${
                  rating === e.value ? "scale-125 ring-2 ring-primary rounded-full" : "opacity-60 hover:opacity-100"
                }`}
                title={e.label}
              >
                {e.emoji}
              </button>
            ))}
          </div>

          {/* Message */}
          <textarea
            placeholder="Tell us more (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />

          {/* Submit */}
          <button
            onClick={handleSend}
            disabled={sending || !rating}
            className="w-full h-10 rounded-xl bg-muted/60 hover:bg-muted border border-border/40 text-foreground font-semibold text-sm transition-colors disabled:opacity-40"
          >
            {sending ? "Sending..." : "Send feedback"}
          </button>
        </div>
      )}
    </>
  );
}
