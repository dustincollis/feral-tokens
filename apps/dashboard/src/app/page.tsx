"use client";

import { useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { PostInbox } from "@/components/inbox/PostInbox";
import {
  EpisodeBuilder,
  ProviderOption,
  PROVIDER_OPTIONS,
} from "@/components/builder/EpisodeBuilder";
import { ScriptPanel } from "@/components/script/ScriptPanel";
import { generateScript } from "@/lib/api";

export default function Home() {
  const [episodePosts, setEpisodePosts] = useState<UnifiedPost[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption>(
    PROVIDER_OPTIONS[0]
  );

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
      const result = await generateScript(
        episodePosts.map((p) => p.id),
        undefined,
        {
          provider: selectedProvider.provider,
          model: selectedProvider.model,
        }
      );
      setScript(result.script);
    } catch (err) {
      console.error("Script generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  const colStyle = {
    width: "33.333%",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "white",
    borderRight: "1px solid #e5e7eb",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <div style={colStyle}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <h1
            style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}
          >
            Feral Tokens
          </h1>
          <p style={{ fontSize: "12px", color: "#6b7280" }}>Content Inbox</p>
          <a href="/settings" style={{ fontSize: "12px", color: "#3b82f6" }}>
            Settings
          </a>
        </div>
        <PostInbox
          onAddToEpisode={handleAddToEpisode}
          episodePostIds={episodePosts.map((p) => p.id)}
        />
      </div>

      <div style={colStyle}>
        <EpisodeBuilder
          posts={episodePosts}
          onRemove={handleRemove}
          onReorder={handleReorder}
          onGenerateScript={handleGenerateScript}
          generating={generating}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
        />
      </div>

      <div style={{ ...colStyle, borderRight: "none" }}>
        <ScriptPanel script={script} onScriptChange={setScript} />
      </div>
    </div>
  );
}
