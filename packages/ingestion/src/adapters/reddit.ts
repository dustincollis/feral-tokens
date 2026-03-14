import { RawPost, SourceAdapter, SourceConfig } from "@feral-tokens/shared";

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
    preview?: {
      images: Array<{
        source: { url: string };
      }>;
    };
    post_hint?: string;
    is_gallery?: boolean;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

export class RedditAdapter implements SourceAdapter {
  async fetch(config: SourceConfig, since: Date): Promise<RawPost[]> {
    const subreddits: string[] = (config.config as any).subreddits ?? [];
    const results: RawPost[] = [];

    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=100`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": process.env.REDDIT_USER_AGENT ?? "feraltokens/1.0",
          },
        });

        if (!response.ok) {
          console.error(`Reddit fetch failed for r/${subreddit}: ${response.status}`);
          continue;
        }

        const json = (await response.json()) as RedditResponse;
        const posts = json.data.children;

        for (const post of posts) {
          const d = post.data;
          const publishedAt = new Date(d.created_utc * 1000);
          if (publishedAt < since) continue;

          let imageUrl: string | null = null;
          if (d.post_hint === "image") {
            imageUrl = d.url;
          } else if (d.preview?.images?.[0]) {
            imageUrl = d.preview.images[0].source.url.replace(/&amp;/g, "&");
          }

          results.push({
            external_id: d.id,
            source_id: config.id,
            platform: "reddit",
            title: d.title,
            body: d.selftext || null,
            image_url: imageUrl,
            post_url: `https://reddit.com${d.permalink}`,
            author: d.author,
            published_at: publishedAt.toISOString(),
            engagement: {
              score: d.score,
              num_comments: d.num_comments,
            },
          });
        }
      } catch (err) {
        console.error(`Error fetching r/${subreddit}:`, err);
      }
    }

    return results;
  }
}