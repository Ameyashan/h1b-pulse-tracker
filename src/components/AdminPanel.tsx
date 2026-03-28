import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Admin Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tracked Subreddits</Label>
            <Input defaultValue="h1b" className="bg-secondary border-border text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Polling Interval (minutes)</Label>
            <Input type="number" defaultValue={10} className="bg-secondary border-border text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Keywords (comma-separated)</Label>
            <Input defaultValue="selected, not selected, waiting, lottery, h1b, cap" className="bg-secondary border-border text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Blocklist Patterns</Label>
            <Input defaultValue="spam, advertisement" className="bg-secondary border-border text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reddit Client ID</Label>
            <Input placeholder="Set REDDIT_CLIENT_ID in secrets" className="bg-secondary border-border text-sm font-mono" disabled />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reddit Client Secret</Label>
            <Input placeholder="Set REDDIT_CLIENT_SECRET in secrets" className="bg-secondary border-border text-sm font-mono" disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            To go live: register a Reddit app at{" "}
            <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              reddit.com/prefs/apps
            </a>
            , then set <code className="bg-secondary px-1 rounded text-accent">REDDIT_CLIENT_ID</code> and{" "}
            <code className="bg-secondary px-1 rounded text-accent">REDDIT_CLIENT_SECRET</code> in your secrets.
          </p>
        </div>
      </div>
    </div>
  );
}
