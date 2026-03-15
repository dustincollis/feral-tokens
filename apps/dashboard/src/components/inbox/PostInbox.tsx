"use client";

import { useEffect, useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { supabase } from "@/lib/supabase";
import { PostCard } from "./PostCard";

interface PostInboxProps {
  onAddToEpisode: (post: UnifiedPost) => void;
  episodePostIds: string[];
}

const PLATFORMS = ["all", "reddit", "youtube", "x"];
const CATEGORIES = ["all", "companion", "behavior", "funny", "concerning", "meta", "other"];

export function PostInbox({ onAddToEpisode, episodePostIds }: PostInboxProps) {
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [platform, category, minScore]);

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select("*")
      .eq("status", "scored")
      .gte("score", minScore)
      .order("score", { ascending: false })
      .limit(100);

    if (platform !== "all") query = query.eq("platform", platform);
    if (category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (!error && data) setPosts(data as UnifiedPost[]);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "8px", padding: "12px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ fontSize: "13px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "2px 8px" }}>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ fontSize: "13px", border: "1px solid #d1d5db", borderRadius: "4px", padding: "2px 8px" }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <span>Min score:</span>
          <input type="number" min={0} max={10} step={0.5} value={minScore} onChange={(e) => setMinScore(parseFloat(e.target.value))} style={{ border: "1px solid #d1d5db", borderRadius: "4px", padding: "2px 4px", width: "56px" }} />
        </div>
        <button onClick={fetchPosts} style={{ fontSize: "13px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", padding: "2px 12px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          No posts found
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              selected={episodePostIds.includes(post.id)}
              onSelect={onAddToEpisode}
            />
          ))}
        </div>
      )}
    </div>
  );
}