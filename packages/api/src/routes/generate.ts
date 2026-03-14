import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";
import Anthropic from "@anthropic-ai/sdk";

export const generateRoute = new Hono();

const client = new Anthropic();

generateRoute.post("/", async (c) => {
  const body = await c.req.json();
  const { episode_id, post_ids } = body;

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

  const postsText = posts
    .map((p, i) => [
      `## Bit ${i + 1}: ${p.title}`,
      `Platform: ${p.platform}`,
      `URL: ${p.post_url}`,
      p.body ? `Content: ${p.body.slice(0, 300)}` : "",
      `Score: ${p.score} | Category: ${p.category}`,
      `Why it scored: ${p.score_data?.reason ?? "N/A"}`,
    ].filter(Boolean).join("\n"))
    .join("\n\n");

  const prompt = [
    "You are writing a script for Feral Tokens, a YouTube channel about AI culture.",
    "The host has a dry, observational, systems-oriented voice.",
    "The format is a weekly roundup of 5-8 AI interaction screenshots and posts.",
    "Each bit is 30-60 seconds of commentary. Total video should be 6-9 minutes.",
    "",
    "Write a complete script for this episode based on the following posts.",
    "Include an intro, commentary for each bit, and an outro.",
    "Write in a conversational tone as if speaking directly to camera.",
    "",
    "Posts for this episode:",
    postsText,
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const script =
    message.content[0].type === "text" ? message.content[0].text : "";

  if (episode_id) {
    await supabase
      .from("episodes")
      .update({
        script,
        status: "scripted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", episode_id);
  }

  return c.json({ script });
});