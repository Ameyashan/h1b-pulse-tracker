import { supabase } from "@/integrations/supabase/client";

const REDDIT_JSON_URL = "https://www.reddit.com/r/h1b/new.json?limit=25&raw_json=1";

export async function fetchAndIngestRedditPosts(): Promise<{
  success: boolean;
  fetched: number;
  inserted: number;
  error?: string;
}> {
  try {
    // Fetch from Reddit (works from browser - no IP blocking)
    const res = await fetch(REDDIT_JSON_URL, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Reddit returned ${res.status}`);
    }

    const data = await res.json();
    const posts = data?.data?.children?.map((c: any) => c.data) || [];

    if (posts.length === 0) {
      return { success: true, fetched: 0, inserted: 0 };
    }

    // Send to edge function for classification + storage
    const { data: result, error } = await supabase.functions.invoke("ingest-signals", {
      body: { posts },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      fetched: posts.length,
      inserted: result?.inserted || 0,
    };
  } catch (err) {
    console.error("Reddit fetch error:", err);
    return {
      success: false,
      fetched: 0,
      inserted: 0,
      error: String(err),
    };
  }
}
