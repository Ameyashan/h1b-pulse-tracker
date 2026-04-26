import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TickerItem = { src: string; time: string; text: string; url?: string };

const FALLBACK_ITEMS: TickerItem[] = [
  { src: "Reuters", time: "12m", text: "USCIS announces H1B cap reached for FY2027 — second selection unlikely" },
  { src: "Forbes", time: "2h", text: "Premium processing fee increases to $2,905 effective May 1" },
  { src: "WSJ", time: "5h", text: "Federal judge pauses new H1B visa rule implementation pending review" },
  { src: "Bloomberg", time: "6h", text: "Tech layoffs slow — H1B transfer rate rebounds 12% in Q1" },
  { src: "NYT", time: "1d", text: "DHS proposes rule change clarifying \"specialty occupation\" definition" },
  { src: "CNBC", time: "1d", text: "H1B denial rate drops to decade-low 2.1% under current administration" },
  { src: "Reuters", time: "2d", text: "Indian IT firms win 62% of FY2027 selections, up from 58% last year" },
  { src: "Forbes", time: "2d", text: "Bipartisan bill would exempt STEM PhDs from the H1B cap entirely" },
];

export function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK_ITEMS);

  useEffect(() => {
    supabase.functions.invoke("fetch-news").then(({ data }) => {
      if (data?.items?.length > 0) {
        setItems(
          (data.items as { src: string; title: string; time: string; url?: string }[]).map((n) => ({
            src: n.src,
            text: n.title,
            time: n.time.replace(/ ago$/, ""),
            url: n.url,
          }))
        );
      }
    }).catch(() => {});
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="ticker">
      <div className="ticker-label">
        <span className="dot" />
        Live News
      </div>
      <div className="ticker-scroll">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <a
              className="ticker-item"
              key={i}
              href={item.url ?? `https://www.google.com/search?q=${encodeURIComponent(item.text)}&tbm=nws`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="src">{item.src}</span>
              <span>{item.text}</span>
              <span className="time">{item.time} ago</span>
              <span className="sep">●</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
