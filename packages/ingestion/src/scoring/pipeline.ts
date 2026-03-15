import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@feral-tokens/shared";
import { buildScoringPrompt } from "./prompt";
import { parseScoringResponse } from "./parse";

const client = new Anthropic();

const BATCH_SIZE = 15;

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
      const prompt = buildScoringPrompt(batch);

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      const scores = parseScoringResponse(responseText);

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

      console.log(`Scored batch ${Math.floor(i / BATCH_SIZE) + 1}: ${scores.length} posts`);

      if (i + BATCH_SIZE < posts.length) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    } catch (err) {
      console.error(`Scoring batch failed:`, err);
    }
  }
}