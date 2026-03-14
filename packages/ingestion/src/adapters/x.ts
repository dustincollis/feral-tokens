import { RawPost, SourceAdapter, SourceConfig } from "@feral-tokens/shared";

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  description?: string;
}

export class XAdapter implements SourceAdapter {
  async fetch(config: SourceConfig, since: Date): Promise<RawPost[]> {
    const accounts: string[] = (config.config as any).accounts ?? [];
    const results: RawPost[] = [];

    for (const account of accounts) {
      try {
        const url = `https://rsshub.app/twitter/user/${account}`;
        const response = await fetch(url, {
          headers: { Accept: "application/rss+xml" },
        });

        if (!response.ok) {
          console.error(`X RSS fetch failed for @${account}: ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = this.parseRSS(xml);

        for (const item of items) {
          const publishedAt = new Date(item.pubDate);
          if (publishedAt < since) continue;

          const externalId = item.link.split("/").pop() ?? item.link;

          results.push({
            external_id: externalId,
            source_id: config.id,
            platform: "x",
            title: item.title,
            body: item.description ?? null,
            image_url: null,
            post_url: item.link,
            author: item.author ?? account,
            published_at: publishedAt.toISOString(),
            engagement: {},
          });
        }
      } catch (err) {
        console.error(`Error fetching X account @${account}:`, err);
      }
    }

    return results;
  }

  private parseRSS(xml: string): RSSItem[] {
    const items: RSSItem[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const block = match[1];
      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? (m[1] ?? m[2] ?? "").trim() : "";
      };

      items.push({
        title: get("title"),
        link: get("link"),
        pubDate: get("pubDate"),
        author: get("author") || undefined,
        description: get("description") || undefined,
      });
    }

    return items;
  }
}