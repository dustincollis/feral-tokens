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

const PANEL_LABELS: Record<Panel, string> = {
  inbox: "Content Inbox",
  builder: "Episode Builder",
  script: "Script",
};

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
    return {
      width: getWidth(panel),
      height: "100vh" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      backgroundColor: "white",
      borderRight: isLast ? "none" : "1px solid #e5e7eb",
      overflow: "hidden" as const,
      transition: "width 0.25s ease",
      position: "relative" as const,
    };
  }

  function tabStyle(panel: Panel) {
    const isActive = panel === activePanel;
    return {
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: isActive ? ("600" as const) : ("400" as const),
      color: isActive ? "#111827" : "#9ca3af",
      cursor: "pointer" as const,
      borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
      whiteSpace: "nowrap" as const,
      overflow: "hidden" as const,
      textOverflow: "ellipsis" as const,
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
            cursor: activePanel !== "inbox" ? "pointer" : "default",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: activePanel === "inbox" ? "18px" : "14px",
                fontWeight: "bold",
                color: "#111827",
                transition: "font-size 0.25s ease",
              }}
            >
              Feral Tokens
            </h1>
            {activePanel === "inbox" && (
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                Content Inbox
              </p>
            )}
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
        {activePanel === "inbox" ? (
          <PostInbox
            onAddToEpisode={handleAddToEpisode}
            episodePostIds={episodePosts.map((p) => p.id)}
          />
        ) : (
          <CollapsedHint
            label="Inbox"
            count={undefined}
          />
        )}
      </div>

      {/* Builder Panel */}
      <div
        style={panelStyle("builder", false)}
        onClick={() => activePanel !== "builder" && setActivePanel("builder")}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            cursor: activePanel !== "builder" ? "pointer" : "default",
          }}
        >
          <h2
            style={{
              fontSize: activePanel === "builder" ? "16px" : "14px",
              fontWeight: "600",
              color: activePanel === "builder" ? "#111827" : "#6b7280",
              transition: "font-size 0.25s ease",
            }}
          >
            Episode Builder
            {episodePosts.length > 0 && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "#3b82f6",
                  fontWeight: "500",
                }}
              >
                {episodePosts.length} bits
              </span>
            )}
          </h2>
        </div>
        {activePanel === "builder" ? (
          <EpisodeBuilder
            posts={episodePosts}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onGenerateScript={handleGenerateScript}
            generating={generating}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
          />
        ) : (
          <CollapsedHint
            label="Builder"
            count={episodePosts.length > 0 ? episodePosts.length : undefined}
          />
        )}
      </div>

      {/* Script Panel */}
      <div
        style={panelStyle("script", true)}
        onClick={() => activePanel !== "script" && setActivePanel("script")}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            cursor: activePanel !== "script" ? "pointer" : "default",
          }}
        >
          <h2
            style={{
              fontSize: activePanel === "script" ? "16px" : "14px",
              fontWeight: "600",
              color: activePanel === "script" ? "#111827" : "#6b7280",
              transition: "font-size 0.25s ease",
            }}
          >
            Script
            {script && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "#22c55e",
                  fontWeight: "500",
                }}
              >
                ready
              </span>
            )}
          </h2>
        </div>
        {activePanel === "script" ? (
          <ScriptPanel script={script} onScriptChange={setScript} />
        ) : (
          <CollapsedHint
            label="Script"
            count={undefined}
            ready={!!script}
          />
        )}
      </div>
    </div>
  );
}

function CollapsedHint({
  label,
  count,
  ready,
}: {
  label: string;
  count?: number;
  ready?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "#d1d5db",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#d1d5db",
        }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: "11px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "999px",
            padding: "2px 8px",
            fontWeight: "600",
          }}
        >
          {count}
        </span>
      )}
      {ready && (
        <span
          style={{
            fontSize: "11px",
            backgroundColor: "#22c55e",
            color: "white",
            borderRadius: "999px",
            padding: "2px 8px",
            fontWeight: "600",
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}
