"use client";

import { useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { PostInbox } from "@/components/inbox/PostInbox";
import { EpisodeBuilder } from "@/components/builder/EpisodeBuilder";
import { ScriptPanel } from "@/components/script/ScriptPanel";
import { generateScript } from "@/lib/api";

export default function Home() {
  const [episodePosts, setEpisodePosts] = useState<UnifiedPost[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);

  function handleAddToEpisode(post: UnifiedPost) {
    setEpisodePosts((prev) => {
      if (prev.find((p) => p.id === post.id)) {
        return prev.filter((p) => p.id !== post.id);
      }
      return [...prev, post];
    });
  }

  function handleRemove(postId: string) {
    setEpisodePosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleReorder(from: number, to: number) {
    setEpisodePosts((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleGenerateScript() {
    if (episodePosts.length === 0) return;
    setGenerating(true);
    try {
      const result = await generateScript(episodePosts.map((p) => p.id));
      setScript(result.script);
    } catch (err) {
      console.error("Script generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-1/3 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-gray-900">Feral Tokens</h1>
          <p className="text-xs text-gray-500">Content Inbox</p>
        </div>
        <PostInbox
          onAddToEpisode={handleAddToEpisode}
          episodePostIds={episodePosts.map((p) => p.id)}
        />
      </div>

      <div className="w-1/3 border-r bg-white flex flex-col">
        <EpisodeBuilder
          posts={episodePosts}
          onRemove={handleRemove}
          onReorder={handleReorder}
          onGenerateScript={handleGenerateScript}
          generating={generating}
        />
      </div>

      <div className="w-1/3 bg-white flex flex-col">
        <ScriptPanel script={script} onScriptChange={setScript} />
      </div>
    </div>
  );
}