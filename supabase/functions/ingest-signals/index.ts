import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEYWORDS: Record<string, { patterns: string[]; classification: string }> = {
  selected: {
    patterns: [
      "got selected", "i was selected", "status changed to selected", "been selected",
      "just selected", "finally selected", "selected!", "selected!!", "my status.*selected",
      "account shows selected", "showing selected", "i got selected", "we got selected",
      "i am selected", "got picked", "i was picked",
    ],
    classification: "selected",
  },
  not_selected: {
    patterns: [
      "not selected", "wasn't selected", "wasnt selected", "not been selected",
      "rejected", "denial", "didn't get selected", "didnt get selected",
      "not picked", "wasn't picked", "wasnt picked",
    ],
    classification: "not_selected",
  },
  waiting: {
    patterns: [
      "still waiting", "no update", "still submitted", "pending", "anyone else waiting",
      "status hasn't changed", "status hasnt changed", "no change", "anyone waiting",
      "waiting to hear", "haven't heard", "havent heard", "any update",
    ],
    classification: "waiting",
  },
};

function classify(text: string): { classification: string; confidence: number } {
  const lower = text.toLowerCase();
  for (const [, { patterns, classification }] of Object.entries(KEYWORDS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern) || new RegExp(pattern, "i").test(lower)) {
        return { classification, confidence: 0.85 + Math.random() * 0.1 };
      }
    }
  }
  return { classification: "noise", confidence: 0.5 };
}

const EMPLOYERS = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Tesla",
  "Infosys", "TCS", "Wipro", "Cognizant", "Deloitte", "Accenture",
  "IBM", "Oracle", "Salesforce", "Adobe", "Intel", "Qualcomm", "NVIDIA",
  "Uber", "Lyft", "Airbnb", "Twitter", "Stripe", "Coinbase", "JPMorgan",
  "Goldman", "Morgan Stanley", "Capital One", "Walmart", "Target",
];

function extractEmployers(text: string): string[] {
  return EMPLOYERS.filter(e => text.toLowerCase().includes(e.toLowerCase()));
}

function extractCapType(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("master") || lower.includes("advanced degree")) return "Master's";
  if (lower.includes("regular cap") || lower.includes("bachelor")) return "Regular";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { posts = [], comments = [] } = await req.json();

    console.log(`Processing ${posts.length} posts and ${comments.length} comments`);

    let inserted = 0;
    let skipped = 0;

    // Process posts
    for (const post of posts) {
      const sourceId = `reddit_post_${post.id}`;
      const fullText = `${post.title} ${post.selftext || ""}`;
      const { classification, confidence } = classify(fullText);

      const signal = {
        source_id: sourceId,
        source_type: "post" as const,
        title: post.title || "",
        body: (post.selftext || "").slice(0, 5000),
        permalink: `https://reddit.com${post.permalink}`,
        author: post.author || "[deleted]",
        created_utc: new Date(post.created_utc * 1000).toISOString(),
        score: post.score || 0,
        flair: post.link_flair_text || null,
        classification,
        confidence,
        employer_mentions: extractEmployers(fullText),
        cap_type: extractCapType(fullText),
        extracted_at: new Date().toISOString(),
        raw_json: post,
      };

      const { error } = await supabase
        .from("signals")
        .upsert(signal, { onConflict: "source_id", ignoreDuplicates: true });

      if (error) {
        console.error(`Error inserting post ${sourceId}:`, error.message);
        skipped++;
      } else {
        inserted++;
      }
    }

    // Process comments
    for (const comment of comments) {
      const sourceId = `reddit_comment_${comment.id}`;
      const fullText = `${comment._parent_post_title || ""} ${comment.body || ""}`;
      const { classification, confidence } = classify(fullText);

      const signal = {
        source_id: sourceId,
        source_type: "comment" as const,
        title: comment._parent_post_title || "(comment)",
        body: (comment.body || "").slice(0, 5000),
        permalink: `https://reddit.com${comment.permalink}`,
        author: comment.author || "[deleted]",
        created_utc: new Date(comment.created_utc * 1000).toISOString(),
        score: comment.score || 0,
        flair: null,
        classification,
        confidence,
        employer_mentions: extractEmployers(fullText),
        cap_type: extractCapType(fullText),
        extracted_at: new Date().toISOString(),
        raw_json: comment,
      };

      const { error } = await supabase
        .from("signals")
        .upsert(signal, { onConflict: "source_id", ignoreDuplicates: true });

      if (error) {
        console.error(`Error inserting comment ${sourceId}:`, error.message);
        skipped++;
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, fetched: posts.length + comments.length, inserted, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
