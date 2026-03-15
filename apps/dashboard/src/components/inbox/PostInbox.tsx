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

    const channel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: "score=gte.7" },
        (payload) => {
          setPosts((prev) => [payload.new as UnifiedPost, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-4 border-b flex-wrap">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <span>Min score:</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value))}
            className="border rounded px-2 py-1 w-16"
          />
        </div>
        <button
          onClick={fetchPosts}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No posts found
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1">
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