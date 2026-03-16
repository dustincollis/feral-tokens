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
import { SavedCollectionsPanel } from "@/components/saved/SavedCollectionsPanel";
import { generateScript, createSavedCollection } from "@/lib/api";

type Tab = "inbox" | "collections" | "saved" | "script";

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "inbox", label: "Content Inbox", color: "#3b82f6" },
  { key: "collections", label: "Collections", color: "#7c3aed" },
  { key: "saved", label: "Saved", color: "#f59e0b" },
  { key: "script", label: "Script", color: "#22c55e" },
];

export default function Home() {
  const [episodePosts, setEpisodePosts] = useState<UnifiedPost[]>([]);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption>(
    PROVIDER_OPTIONS[0]
  );
  const [refreshKey, setRefreshKey] = useState(0);

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
    setActiveTab("inbox");
  }

  async function handleSaveCollection(name: string) {
    await createSavedCollection(
      name,
      episodePosts.map((p) => p.id)
    );
    setRefreshKey((k) => k + 1);
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
    setActiveTab("script");
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
      {/* Left: Tab bar + content */}
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
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#fafafa",
            flexShrink: 0,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? tab.color : "#6b7280",
                  backgroundColor: isActive ? "white" : "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? `2px solid ${tab.color}`
                    : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
                {tab.key === "script" && script && !isActive && (
                  <span
                    style={{
                      marginLeft: "6px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      display: "inline-block",
                    }}
                  />
                )}
                {tab.key === "collections" && !isActive && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "11px",
                      color: "#9ca3af",
                    }}
                  >
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <a
            href="/settings"
            style={{
              fontSize: "12px",
              color: "#3b82f6",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Settings
          </a>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "inbox" && (
            <PostInbox
              onAddToEpisode={handleAddToEpisode}
              episodePostIds={episodePosts.map((p) => p.id)}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === "collections" && (
            <CollectionsPanel
              onLoadCollection={handleLoadCollection}
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
            />
          )}

          {activeTab === "saved" && (
            <SavedCollectionsPanel
              onLoadCollection={handleLoadCollection}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === "script" && (
            <ScriptPanel script={script} onScriptChange={setScript} />
          )}
        </div>
      </div>

      {/* Right: Episode Builder - always visible at 25% */}
      <div
        style={{
          width: "25%",
          minWidth: "280px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
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
          script={script}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          onSaveCollection={handleSaveCollection}
        />
      </div>
    </div>
  );
}
