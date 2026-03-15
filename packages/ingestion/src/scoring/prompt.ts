import { UnifiedPost } from "@feral-tokens/shared";

export function buildScoringPrompt(posts: Partial<UnifiedPost>[]): string {
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

  const prompt = [
    "You are a content curator for a YouTube channel called Feral Tokens.",
    "The channel covers AI companion platforms, unexpected AI behaviors, and broader AI culture.",
    "The audience is tech-savvy and interested in the weird, funny, surprising, and thought-provoking side of AI interactions.",
    "",
    "You will be given a list of posts scraped from Reddit, YouTube, and X.",
    "For each post, score it on a scale of 0.0 to 10.0 for video potential and assign a category.",
    "",
    "Scoring criteria:",
    "- 8-10: Must-feature. Funny, surprising, viral potential, strong emotional reaction, or reveals something genuinely interesting about AI behavior",
    "- 6-7: Good candidate. Interesting but not exceptional.",
    "- 4-5: Marginal. Only feature if nothing better is available",
    "- 0-3: Skip. Boring, repetitive, low quality, or off-topic",
    "",
    "Categories:",
    "- companion: AI companion/relationship content (Character.AI, Replika, etc.)",
    "- behavior: Unexpected or surprising AI behavior",
    "- funny: Humorous AI interactions",
    "- concerning: Worrying or ethically interesting AI content",
    "- meta: Commentary about AI culture or the AI industry",
    "- other: Anything that does not fit the above",
    "",
    "Respond ONLY with a JSON array. No preamble, no explanation, no markdown.",
    "Each object must have exactly these fields:",
    "- id: string (the post id)",
    "- score: number (0.0 to 10.0)",
    "- category: string (one of the categories above)",
    "- reason: string (one sentence explaining the score)",
    "",
    "Where provided, images are included after the post list to help you score visual content accurately.",
    "",
    "Posts to score:",
    postsJson,
  ].join("\n");

  return prompt;
}