import { supabase } from "@/integrations/supabase/client";

const REDDIT_BASE = "https://www.reddit.com";

export async function fetchAndIngestRedditPosts(): Promise<{
  success: boolean;
  fetched: number;
  inserted: number;
  error?: string;
}> {
  try {
    // 1. Fetch new posts
    const postsRes = await fetch(`${REDDIT_BASE}/r/h1b/new.json?limit=25&raw_json=1`, {
      headers: { "Accept": "application/json" },
    });

    if (!postsRes.ok) throw new Error(`Reddit posts returned ${postsRes.status}`);

    const postsData = await postsRes.json();
    const posts = postsData?.data?.children?.map((c: any) => c.data) || [];

    // 2. For posts with comments, fetch top-level comments
    const allComments: any[] = [];
    const postsWithComments = posts.filter((p: any) => p.num_comments > 0).slice(0, 5); // limit to 5 posts to avoid rate limits

    for (const post of postsWithComments) {
      try {
        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 500));
        const commentsRes = await fetch(
          `${REDDIT_BASE}/r/h1b/comments/${post.id}.json?limit=10&depth=1&raw_json=1`,
          { headers: { "Accept": "application/json" } }
        );
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          // commentsData[1] contains the comments listing
          const comments = commentsData?.[1]?.data?.children
            ?.filter((c: any) => c.kind === "t1")
            ?.map((c: any) => ({
              ...c.data,
              _parent_post_title: post.title,
              _parent_post_permalink: post.permalink,
            })) || [];
          allComments.push(...comments);
        }
      } catch (err) {
        console.warn(`Failed to fetch comments for post ${post.id}:`, err);
      }
    }

    if (posts.length === 0 && allComments.length === 0) {
      return { success: true, fetched: 0, inserted: 0 };
    }

    // 3. Send posts + comments to edge function
    const { data: result, error } = await supabase.functions.invoke("ingest-signals", {
      body: { posts, comments: allComments },
    });

    if (error) throw error;

    return {
      success: true,
      fetched: posts.length + allComments.length,
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
