export type Platform = "reddit" | "youtube" | "x" | "instagram";

export interface SourceConfig {
  id: string;
  name: string;
  platform: Platform;
  enabled: boolean;
  config: Record<string, unknown>;
  last_scraped_at: string | null;
  health_status: "healthy" | "degraded" | "down";
}

export interface RawPost {
  external_id: string;
  source_id: string;
  platform: Platform;
  title: string;
  body: string | null;
  image_url: string | null;
  post_url: string;
  author: string | null;
  published_at: string;
  engagement: Record<string, number>;
}

export interface UnifiedPost {
  id: string;
  external_id: string;
  source_id: string;
  platform: string;
  title: string;
  body: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  post_url: string;
  author: string | null;
  published_at: string;
  engagement: Record<string, number>;
  content_hash: string;
  status: "pending_score" | "scored" | "rejected" | "featured";
  score: number | null;
  category: string | null;
  score_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SavedCollection {
  id: string;
  short_id: string;
  name: string;
  post_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceAdapter {
  fetch(config: SourceConfig, since: Date): Promise<RawPost[]>;
}