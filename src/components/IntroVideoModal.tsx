import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const STORAGE_KEY = "h1b-pulse-intro-seen";

export function IntroVideoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch {
      setOpen(true);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[760px] p-0 overflow-hidden bg-[#0F1115] border-0 gap-0">
        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <DialogTitle className="text-white text-base font-semibold tracking-tight">
            Here's what's new on H1B Pulse
          </DialogTitle>
          <p className="text-white/60 text-xs mt-1">
            A quick 20-second tour of what you can do here.
          </p>
        </div>
        <iframe
          src="/h1b-pulse-intro.html"
          title="H1B Pulse intro"
          style={{
            display: "block",
            width: "100%",
            aspectRatio: "3 / 2",
            border: 0,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
