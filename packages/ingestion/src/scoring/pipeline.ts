import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@feral-tokens/shared";
import { buildScoringPrompt } from "./prompt";
import { parseScoringResponse } from "./parse";

const client = new Anthropic();

const BATCH_SIZE = 8;

export async function runScoringPipeline(): Promise<void> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "pending_score")
    .limit(500);

  if (error) {
    console.error("Failed to fetch posts for scoring:", error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log("No posts to score");
    return;
  }

  console.log(`Scoring ${posts.length} posts in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    try {
      // Build content array with text prompt + images for posts that have them
      const content: Anthropic.MessageParam["content"] = [];

      // Add the text prompt first
      const prompt = buildScoringPrompt(batch);
      content.push({ type: "text", text: prompt });

      // Add images for posts that have thumbnail URLs
      for (const post of batch) {
        if (post.thumbnail_url) {
          try {
            const response = await fetch(post.thumbnail_url);
            if (response.ok) {
              const contentType =
                response.headers.get("content-type") ?? "image/jpeg";
              if (contentType.startsWith("image/")) {
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                content.push({
                  type: "text",
                  text: `Image for post id=${post.id} (${post.title}):`,
                });
                content.push({
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: contentType as
                      | "image/jpeg"
                      | "image/png"
                      | "image/gif"
                      | "image/webp",
                    data: base64,
                  },
                });
              }
            }
          } catch (imgErr) {
            // Skip image if it fails — text scoring still works
          }
        }
      }

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content }],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      const scores = parseScoringResponse(responseText);

      for (const score of scores) {
        await supabase
          .from("posts")
          .update({
            score: score.composite,
            score_commentary: score.commentary,
            score_visual: score.visual,
            score_virality: score.virality,
            score_topical: score.topical,
            pitch: score.pitch,
            category: score.category,
            status: "scored",
            updated_at: new Date().toISOString(),
          })
          .eq("id", score.id);
      }

      console.log(
        `Scored batch ${Math.floor(i / BATCH_SIZE) + 1}: ${scores.length} posts`
      );

      if (i + BATCH_SIZE < posts.length) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    } catch (err) {
      console.error(`Scoring batch failed:`, err);
    }
  }
}
