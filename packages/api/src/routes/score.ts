import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";
import Anthropic from "@anthropic-ai/sdk";

export const scoreRoute = new Hono();

const client = new Anthropic();

function buildPrompt(posts: any[]): string {
  const postsJson = JSON.stringify(
    posts.map((p) => ({
      id: p.id,
      platform: p.platform,
      title: p.title,
      body: p.body?.slice(0, 500),
      engagement: p.engagement,
    })),
    null,
    2
  );

  return [
    "You are a content curator for Feral Tokens, a YouTube channel about AI culture.",
    "Score each post 0.0-10.0 for video potential and assign a category.",
    "Categories: companion, behavior, funny, concerning, meta, other",
    "Respond ONLY with a JSON array. Each object must have: id, score, category, reason.",
    "",
    "Posts:",
    postsJson,
  ].join("\n");
}

function parseScores(response: string): any[] {
  try {
    const clean = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
    return [];
  }
}

scoreRoute.post("/", async (c) => {
  const body = await c.req.json();
  const { post_ids } = body;

  if (!post_ids || !Array.isArray(post_ids)) {
    return c.json({ error: "post_ids array is required" }, 400);
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .in("id", post_ids);

  if (error || !posts) {
    return c.json({ error: "Failed to fetch posts" }, 500);
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: buildPrompt(posts) }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const scores = parseScores(responseText);

  for (const score of scores) {
    await supabase
      .from("posts")
      .update({
        score: score.score,
        category: score.category,
        status: "scored",
        score_data: { reason: score.reason },
        updated_at: new Date().toISOString(),
      })
      .eq("id", score.id);
  }

  return c.json({ scored: scores.length });
});