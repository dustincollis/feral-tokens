import { RawPost, UnifiedPost } from "@feral-tokens/shared";
import { hashContent } from "@feral-tokens/shared";

export function normalizePost(raw: RawPost): Omit<UnifiedPost, "id" | "created_at"> {
  return {
    external_id: raw.external_id,
    source_id: raw.source_id,
    platform: raw.platform,
    title: raw.title.trim(),
    body: raw.body?.trim() ?? null,
    image_url: raw.image_url,
    thumbnail_url: null,
    post_url: raw.post_url,
    author: raw.author,
    published_at: raw.published_at,
    engagement: raw.engagement,
    content_hash: hashContent(raw.title, raw.body, raw.image_url),
    status: "pending_score",
    score: null,
    category: null,
    score_data: null,
    dismissed: false,
    updated_at: new Date().toISOString(),
  };
}