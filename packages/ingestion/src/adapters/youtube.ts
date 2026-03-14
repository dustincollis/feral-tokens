import { RawPost, SourceAdapter, SourceConfig } from "@feral-tokens/shared";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails: {
      high: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

export class YouTubeAdapter implements SourceAdapter {
  async fetch(config: SourceConfig, since: Date): Promise<RawPost[]> {
    const keywords: string[] = (config.config as any).keywords ?? [];
    const apiKey = process.env.YOUTUBE_API_KEY;
    const results: RawPost[] = [];

    if (!apiKey) {
      console.error("YOUTUBE_API_KEY not set");
      return results;
    }

    for (const keyword of keywords) {
      try {
        const params = new URLSearchParams({
          part: "snippet",
          q: keyword,
          type: "video",
          order: "date",
          publishedAfter: since.toISOString(),
          maxResults: "25",
          key: apiKey,
        });

        const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`YouTube fetch failed for "${keyword}": ${response.status}`);
          continue;
        }

        const json = (await response.json()) as YouTubeSearchResponse;

        for (const item of json.items ?? []) {
          const s = item.snippet;
          results.push({
            external_id: item.id.videoId,
            source_id: config.id,
            platform: "youtube",
            title: s.title,
            body: s.description || null,
            image_url: s.thumbnails?.high?.url ?? null,
            post_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            author: s.channelTitle,
            published_at: s.publishedAt,
            engagement: {},
          });
        }
      } catch (err) {
        console.error(`Error fetching YouTube keyword "${keyword}":`, err);
      }
    }

    return results;
  }
}