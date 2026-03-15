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

type Panel = "inbox" | "builder" | "script";

export default function Home() {
  const [episodePosts, setEpisodePosts] = useState<UnifiedPost[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("inbox");
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
    setActivePanel("script");
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

  function getWidth(panel: Panel): string {
    if (panel === activePanel) return "60%";
    return "20%";
  }

  function panelStyle(panel: Panel, isLast: boolean) {
    const isActive = panel === activePanel;
    return {
      width: getWidth(panel),
      height: "100vh" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      backgroundColor: isActive ? "white" : "#fafafa",
      borderRight: isLast ? "none" : "1px solid #e5e7eb",
      overflow: "hidden" as const,
      transition: "width 0.25s ease, background-color 0.25s ease",
      cursor: isActive ? "default" : "pointer",
    };
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* Inbox Panel */}
      <div
        style={panelStyle("inbox", false)}
        onClick={() => activePanel !== "inbox" && setActivePanel("inbox")}
      >
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
                fontSize: activePanel === "inbox" ? "18px" : "13px",
                fontWeight: "bold",
                color: "#111827",
                transition: "font-size 0.25s ease",
                whiteSpace: "nowrap",
              }}
            >
              Feral Tokens
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                whiteSpace: "nowrap",
              }}
            >
              Content Inbox
            </p>
          </div>
          {activePanel === "inbox" && (
            <a
              href="/settings"
              style={{ fontSize: "12px", color: "#3b82f6" }}
              onClick={(e) => e.stopPropagation()}
            >
              Settings
            </a>
          )}
        </div>
        <PostInbox
          onAddToEpisode={handleAddToEpisode}
          episodePostIds={episodePosts.map((p) => p.id)}
        />
      </div>

      {/* Builder Panel */}
      <div
        style={panelStyle("builder", false)}
        onClick={() => activePanel !== "builder" && setActivePanel("builder")}
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

      {/* Script Panel */}
      <div
        style={panelStyle("script", true)}
        onClick={() => activePanel !== "script" && setActivePanel("script")}
      >
        <ScriptPanel script={script} onScriptChange={setScript} />
      </div>
    </div>
  );
}
