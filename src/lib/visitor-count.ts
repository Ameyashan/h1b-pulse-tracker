import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-custom";

export const REGISTER_VISITOR_URL =
  "https://rkwcpnoqnxporjqqlxjt.supabase.co/functions/v1/register-visitor";

async function readVisitorCount(): Promise<number | null> {
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "visitor_count")
    .single();
  return data ? Number(data.value) : null;
}

export function useVisitorCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    readVisitorCount().then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return count;
}
