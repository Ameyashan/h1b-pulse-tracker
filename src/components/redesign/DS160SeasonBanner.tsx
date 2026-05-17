import { useEffect, useState } from "react";

const STORAGE_KEY = "ds160_banner_dismissed_v1";
// Hide the banner automatically after this date (end of FY2027 stamping window).
const BANNER_END_DATE = new Date("2026-09-30T23:59:59Z");

interface DS160SeasonBannerProps {
  onOpen: () => void;
  hideOnTab?: boolean;
}

export function DS160SeasonBanner({ onOpen, hideOnTab }: DS160SeasonBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (hideOnTab) return null;
  if (dismissed) return null;
  if (new Date() > BANNER_END_DATE) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="ds160-banner" role="region" aria-label="DS-160 stamping season">
      <div className="ds160-banner-body">
        <span className="ds160-banner-tag">New</span>
        <span>
          Filling the DS-160 for visa stamping? Our field-by-field guide for H-1B and H-4 is live.{" "}
          <button className="ds160-banner-link" onClick={onOpen}>
            Open the guide →
          </button>
        </span>
      </div>
      <button
        className="ds160-banner-dismiss"
        onClick={dismiss}
        aria-label="Dismiss DS-160 announcement"
      >
        ×
      </button>
    </div>
  );
}
