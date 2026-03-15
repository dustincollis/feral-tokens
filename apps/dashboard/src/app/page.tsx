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
import { CollectionsPanel } from "@/components/collections/CollectionsPanel";
import { generateScript } from "@/lib/api";

type CenterPanel = "inbox" | "collections" | "script";

function VerticalTab({
  label,
  onClick,
  color,
  side,
}: {
  label: string;
  onClick: () => void;
  color: string;
  side: "left" | "right";
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        borderLeft: side === "right" ? "1px solid #e5e7eb" : "none",
        borderRight: side === "left" ? "1px solid #e5e7eb" : "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: side === "left" ? "rotate(180deg)" : "none",
          fontSize: "12px",
          fontWeight: 600,
          color,
          letterSpacing: "1px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const [episodePosts, setEpisodePosts] = useState<UnifiedPost[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [centerPanel, setCenterPanel] = useState<CenterPanel>("inbox");
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

  function handleLoadCollection(posts: UnifiedPost[]) {
    setEpisodePosts(posts);
    setCenterPanel("inbox");
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
    setCenterPanel("script");
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

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f9fafb",
        overflow: "hidden",
      }}
    >
      {/* Left tab: Post Inbox (only when inbox is not center) */}
      {centerPanel !== "inbox" && (
        <VerticalTab
          label="Content Inbox"
          onClick={() => setCenterPanel("inbox")}
          color="#3b82f6"
          side="left"
        />
      )}

      {/* Center stage */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "white",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {centerPanel === "inbox" && (
          <>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  Feral Tokens
                </h1>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  Content Inbox
                </p>
              </div>
              <a
                href="/settings"
                style={{ fontSize: "12px", color: "#3b82f6" }}
              >
                Settings
              </a>
            </div>
            <PostInbox
              onAddToEpisode={handleAddToEpisode}
              episodePostIds={episodePosts.map((p) => p.id)}
            />
          </>
        )}

        {centerPanel === "collections" && (
          <CollectionsPanel
            onLoadCollection={handleLoadCollection}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />
        )}

        {centerPanel === "script" && (
          <ScriptPanel script={script} onScriptChange={setScript} />
        )}
      </div>

      {/* Episode Builder - always visible at 25% */}
      <div
        style={{
          width: "25%",
          minWidth: "280px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          borderRight: "1px solid #e5e7eb",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
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

      {/* Right tabs: Collections and Script (only when not active in center) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {centerPanel !== "collections" && (
          <VerticalTab
            label="Collections"
            onClick={() => setCenterPanel("collections")}
            color="#7c3aed"
            side="right"
          />
        )}
        {centerPanel !== "script" && (
          <VerticalTab
            label="Script"
            onClick={() => setCenterPanel("script")}
            color={script ? "#22c55e" : "#9ca3af"}
            side="right"
          />
        )}
      </div>
    </div>
  );
}
