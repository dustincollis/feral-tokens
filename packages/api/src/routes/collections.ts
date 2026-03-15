import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@feral-tokens/shared";

const collectionsRoute = new Hono();
const client = new Anthropic();

// =============================================================================
// PROMPT
// =============================================================================

const COLLECTIONS_SYSTEM_PROMPT = [
  "You are the episode producer for Feral Tokens, a YouTube channel that covers AI culture",
  "with dry, observational commentary. Your job is to look at a batch of scored posts and",
  "suggest episode lineups.",
  "",
  "You will receive a list of scored posts with their sub-scores (commentary, visual,",
  "virality, topical), composite score, category, and pitch (if available).",
  "",
  "You should suggest MULTIPLE collection options:",
  "",
  "1. WEEKLY ROUNDUP: The best 5-8 posts for a full weekly episode. Prioritize variety",
  "   across categories while keeping quality high. Think about pacing: you want a mix",
  "   of funny, unsettling, and observational. Order them for retention (second-strongest",
  "   first, strongest at 60-70%).",
  "",
  "2. THEMED COLLECTIONS: 2-4 themed mini-collections of 3-5 posts each, based on what",
  "   naturally clusters in the current batch. Examples: 'companion cringe', 'AI behavior',",
  "   'cursed images', 'platform drama'. Only suggest a theme if there are at least 3",
  "   strong posts that fit it. Each themed collection could be a standalone Short or a",
  "   focused video.",
  "",
  "For each collection, explain in ONE sentence why these posts work together and what",
  "the episode angle would be.",
  "",
  "SELECTION CRITERIA:",
  "- Prefer posts with composite scores of 6.0+, but a lower-scoring post can make the",
  "  cut if it provides variety or a good palate cleanser between heavy items.",
  "- Visual score matters a lot. This is a video channel. A post with a 9 visual and 5",
  "  commentary might still be worth including because the image carries the segment.",
  "- Avoid putting too many posts from the same category back to back. Mix it up.",
  "- If a post has a pitch, that pitch is a strong signal of what the segment angle is.",
  "",
  "Respond ONLY with a JSON object. No preamble, no explanation, no markdown.",
  "The structure must be:",
  "{",
  '  "weekly_roundup": {',
  '    "title": "string (episode title suggestion, punchy, not generic)",',
  '    "angle": "string (one sentence on the overall episode vibe)",',
  '    "post_ids": ["string (ordered list of post IDs for optimal retention)"]',
  "  },",
  '  "themed": [',
  "    {",
  '      "title": "string (collection name, e.g. \'Companion Cringe\')",',
  '      "angle": "string (one sentence on why these posts work together)",',
  '      "post_ids": ["string"]',
  "    }",
  "  ]",
  "}",
].join("\n");

// =============================================================================
// ROUTE
// =============================================================================

collectionsRoute.post("/", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const minScore = body.min_score ?? 4.0;
    const provider = body.provider ?? "anthropic";
    const model = body.model ?? "claude-opus-4-20250514";

    // Fetch all scored posts above the minimum threshold
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scored")
      .gte("score", minScore)
      .order("score", { ascending: false })
      .limit(200);

    if (error) {
      return c.json({ error: "Failed to fetch posts" }, 500);
    }

    if (!posts || posts.length === 0) {
      return c.json({ error: "No scored posts found" }, 404);
    }

    // Build a compact representation for the prompt
    const postsForPrompt = posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body?.slice(0, 200) ?? null,
      platform: p.platform,
      category: p.category,
      composite: p.score,
      commentary: p.score_commentary,
      visual: p.score_visual,
      virality: p.score_virality,
      topical: p.score_topical,
      pitch: p.pitch ?? null,
      has_image: !!p.thumbnail_url,
      engagement: p.engagement,
    }));

    const userPrompt = [
      "Here are the currently scored posts. Suggest episode lineups.",
      "",
      "Posts:",
      JSON.stringify(postsForPrompt, null, 2),
    ].join("\n");

    // Helper to attach full post objects to collections
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const enrichCollection = (postIds: string[]) =>
      postIds.map((id) => postMap.get(id)).filter(Boolean);

    const formatResult = (collections: any) => ({
      weekly_roundup: {
        ...collections.weekly_roundup,
        posts: enrichCollection(collections.weekly_roundup.post_ids),
      },
      themed: collections.themed.map((t: any) => ({
        ...t,
        posts: enrichCollection(t.post_ids),
      })),
    });

    if (provider === "anthropic") {
      const message = await client.messages.create({
        model,
        max_tokens: 4000,
        system: COLLECTIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      const clean = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const collections = JSON.parse(clean);
      return c.json(formatResult(collections));
    } else if (provider === "xai") {
      const xaiKey = process.env.XAI_API_KEY;
      if (!xaiKey) {
        return c.json({ error: "XAI_API_KEY not configured" }, 500);
      }

      const xaiResponse = await fetch(
        "https://api.x.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: COLLECTIONS_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 4000,
          }),
        }
      );

      if (!xaiResponse.ok) {
        const errText = await xaiResponse.text();
        return c.json(
          { error: `xAI API error: ${xaiResponse.status}`, details: errText },
          500
        );
      }

      const xaiData = (await xaiResponse.json()) as any;
      const xaiResponseText =
        xaiData.choices?.[0]?.message?.content ?? "";

      const clean = xaiResponseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const collections = JSON.parse(clean);
      return c.json(formatResult(collections));
    } else {
      return c.json({ error: `Unknown provider: ${provider}` }, 400);
    }
  } catch (err: any) {
    console.error("Collections generation failed:", err);
    return c.json({ error: err.message ?? "Unknown error" }, 500);
  }
});

export { collectionsRoute };
