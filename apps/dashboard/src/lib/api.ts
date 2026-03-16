const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export interface ScriptOptions {
  provider?: string;
  model?: string;
}

export async function generateScript(
  postIds: string[],
  episodeId?: string,
  options?: ScriptOptions
) {
  return apiFetch("/api/generate", {
    method: "POST",
    body: JSON.stringify({
      post_ids: postIds,
      episode_id: episodeId,
      provider: options?.provider,
      model: options?.model,
    }),
  });
}

export async function rescorePosts(postIds: string[]) {
  return apiFetch("/api/score", {
    method: "POST",
    body: JSON.stringify({ post_ids: postIds }),
  });
}

export async function triggerScrape(
  sourceId: string
): Promise<{ message: string; source: string; log_id: string | null }> {
  return apiFetch("/api/scrape", {
    method: "POST",
    body: JSON.stringify({ source_id: sourceId }),
  });
}

export async function getScrapeStatus(logId: string): Promise<{
  id: string;
  source_id: string;
  status: string;
  result: any;
  finished_at: string | null;
}> {
  return apiFetch(`/api/scrape/status/${logId}`);
}

export async function getSources() {
  return apiFetch("/api/sources");
}

export interface CollectionOptions {
  provider?: string;
  model?: string;
  min_score?: number;
}

export interface ThemedCollection {
  title: string;
  angle: string;
  post_ids: string[];
  posts: any[];
}

export interface CollectionsResult {
  weekly_roundup: {
    title: string;
    angle: string;
    post_ids: string[];
    posts: any[];
  };
  themed: ThemedCollection[];
}

// Saved Collections
export async function listSavedCollections() {
  return apiFetch("/api/saved-collections");
}

export async function getSavedCollection(id: string) {
  return apiFetch(`/api/saved-collections/${id}`);
}

export async function createSavedCollection(name: string, postIds: string[], notes?: string) {
  return apiFetch("/api/saved-collections", {
    method: "POST",
    body: JSON.stringify({ name, post_ids: postIds, notes }),
  });
}

export async function deleteSavedCollection(id: string) {
  return apiFetch(`/api/saved-collections/${id}`, { method: "DELETE" });
}

export async function getSavedCollectionPostMap(): Promise<Record<string, string[]>> {
  return apiFetch("/api/saved-collections/post-map");
}

export async function generateCollections(
  options?: CollectionOptions
): Promise<CollectionsResult> {
  return apiFetch("/api/collections", {
    method: "POST",
    body: JSON.stringify({
      provider: options?.provider,
      model: options?.model,
      min_score: options?.min_score,
    }),
  });
}
