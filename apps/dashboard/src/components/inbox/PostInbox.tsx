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
const CATEGORIES = [
  "all",
  "companion",
  "behavior",
  "humor",
  "creepy",
  "culture",
  "other",
];

const SORT_OPTIONS = [
  { value: "score", label: "Composite" },
  { value: "score_commentary", label: "Commentary" },
  { value: "score_visual", label: "Visual" },
  { value: "score_virality", label: "Virality" },
  { value: "score_topical", label: "Topical" },
  { value: "created_at", label: "Newest" },
];

const selectStyle = {
  fontSize: "13px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  padding: "2px 8px",
  backgroundColor: "white",
};

export function PostInbox({ onAddToEpisode, episodePostIds }: PostInboxProps) {
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    fetchPosts();
  }, [platform, category, minScore, sortBy]);

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select("*")
      .eq("status", "scored")
      .gte("score", minScore)
      .order(sortBy, { ascending: false })
      .limit(100);

    if (platform !== "all") query = query.eq("platform", platform);
    if (category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (!error && data) setPosts(data as UnifiedPost[]);
    setLoading(false);
  }

  const scoredCount = posts.length;
  const highScoreCount = posts.filter((p) => (p.score ?? 0) >= 7).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={selectStyle}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={selectStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
            }}
          >
            <span>Min:</span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "2px 4px",
                width: "56px",
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectStyle}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchPosts}
            style={{
              fontSize: "13px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "2px 12px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          <span>{scoredCount} posts</span>
          {highScoreCount > 0 && (
            <span style={{ color: "#22c55e" }}>
              {highScoreCount} above 7.0
            </span>
          )}
        </div>
      </div>

      {/* Post list */}
      {loading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
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
