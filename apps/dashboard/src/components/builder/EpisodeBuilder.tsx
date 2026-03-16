"use client";

import { useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { downloadEpisodePackage } from "@/lib/download";

export interface ProviderOption {
  provider: string;
  model: string;
  label: string;
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    provider: "anthropic",
    model: "claude-opus-4-20250514",
    label: "Claude Opus",
  },
  {
    provider: "xai",
    model: "grok-4-fast",
    label: "Grok 4 Fast",
  },
];

interface EpisodeBuilderProps {
  posts: UnifiedPost[];
  onRemove: (postId: string) => void;
  onReorder: (from: number, to: number) => void;
  onGenerateScript: () => void;
  generating: boolean;
  script: string;
  selectedProvider: ProviderOption;
  onProviderChange: (option: ProviderOption) => void;
  onSaveCollection: (name: string) => Promise<void>;
}

function MiniScoreBox({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "#22c55e" : value >= 6 ? "#eab308" : value >= 4 ? "#f97316" : "#dc2626";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1px",
        flex: 1,
      }}
    >
      <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>
        {label}
      </span>
      <div
        style={{
          width: "100%",
          padding: "2px 0",
          borderRadius: "3px",
          backgroundColor: color + "18",
          border: `1px solid ${color}40`,
          textAlign: "center",
          fontSize: "11px",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function EpisodeBuilder({
  posts,
  onRemove,
  onReorder,
  onGenerateScript,
  generating,
  script,
  selectedProvider,
  onProviderChange,
  onSaveCollection,
}: EpisodeBuilderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await onSaveCollection(saveName.trim());
      setSaveSuccess(saveName.trim());
      setShowSaveForm(false);
      setSaveName("");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadEpisodePackage(posts, script);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
            Episode Builder ({posts.length})
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={onGenerateScript}
              disabled={posts.length === 0 || generating}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: posts.length === 0 || generating ? "default" : "pointer",
                backgroundColor: posts.length === 0 || generating ? "#d1d5db" : "#3b82f6",
                color: "white",
                fontWeight: 500,
              }}
            >
              {generating ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!script || posts.length === 0 || downloading}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: !script || posts.length === 0 || downloading ? "default" : "pointer",
                backgroundColor: !script || posts.length === 0 || downloading ? "#d1d5db" : "#22c55e",
                color: "white",
                fontWeight: 500,
              }}
            >
              {downloading ? "Zipping..." : "↓ Zip"}
            </button>
            <button
              onClick={() => {
                setSaveName(`Collection ${new Date().toLocaleDateString()}`);
                setShowSaveForm(true);
                setSaveSuccess(null);
              }}
              disabled={posts.length === 0}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: posts.length === 0 ? "default" : "pointer",
                backgroundColor: posts.length === 0 ? "#d1d5db" : "#f59e0b",
                color: "white",
                fontWeight: 500,
              }}
            >
              Save
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "11px", color: "#9ca3af" }}>Model:</label>
          <select
            value={`${selectedProvider.provider}:${selectedProvider.model}`}
            onChange={(e) => {
              const option = PROVIDER_OPTIONS.find(
                (o) => `${o.provider}:${o.model}` === e.target.value
              );
              if (option) onProviderChange(option);
            }}
            style={{ fontSize: "11px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "2px 6px", color: "#4b5563", backgroundColor: "white" }}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option
                key={`${option.provider}:${option.model}`}
                value={`${option.provider}:${option.model}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {showSaveForm && (
          <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Collection name"
              autoFocus
              style={{
                flex: 1,
                fontSize: "11px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                padding: "3px 6px",
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: saving || !saveName.trim() ? "default" : "pointer",
                backgroundColor: saving || !saveName.trim() ? "#d1d5db" : "#f59e0b",
                color: "white",
                fontWeight: 500,
              }}
            >
              {saving ? "..." : "Save"}
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                backgroundColor: "white",
                color: "#6b7280",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {saveSuccess && (
          <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>
            Saved as collection!
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Click posts in the inbox to add them here
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {posts.map((post, index) => {
            const sd = post.score_data as any;
            const commentary = (post as any).score_commentary ?? sd?.commentary ?? null;
            const visual = (post as any).score_visual ?? sd?.visual ?? null;
            const virality = (post as any).score_virality ?? sd?.virality ?? null;
            const topical = (post as any).score_topical ?? sd?.topical ?? null;
            const pitch = (post as any).pitch ?? sd?.pitch ?? null;
            const hasSubScores =
              commentary !== null && visual !== null && virality !== null && topical !== null;

            return (
              <div
                key={post.id}
                style={{
                  display: "flex",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "white",
                }}
              >
                {/* Number + reorder */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    padding: "8px 6px",
                    backgroundColor: "#f9fafb",
                    borderRight: "1px solid #f3f4f6",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => index > 0 && onReorder(index, index - 1)}
                    disabled={index === 0}
                    style={{
                      fontSize: "11px",
                      color: index === 0 ? "#d1d5db" : "#9ca3af",
                      cursor: index === 0 ? "default" : "pointer",
                      background: "none",
                      border: "none",
                      padding: "2px",
                    }}
                  >
                    ↑
                  </button>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#6b7280",
                      fontFamily: "monospace",
                    }}
                  >
                    {index + 1}
                  </span>
                  <button
                    onClick={() =>
                      index < posts.length - 1 && onReorder(index, index + 1)
                    }
                    disabled={index === posts.length - 1}
                    style={{
                      fontSize: "11px",
                      color: index === posts.length - 1 ? "#d1d5db" : "#9ca3af",
                      cursor: index === posts.length - 1 ? "default" : "pointer",
                      background: "none",
                      border: "none",
                      padding: "2px",
                    }}
                  >
                    ↓
                  </button>
                </div>

                {/* Thumbnail - click to zoom */}
                {post.thumbnail_url && (
                  <div
                    onClick={() => setLightboxSrc(post.thumbnail_url!)}
                    style={{
                      width: "120px",
                      minWidth: "120px",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#f3f4f6",
                      cursor: "zoom-in",
                    }}
                  >
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      style={{
                        width: "120px",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#111827",
                      lineHeight: "1.3",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                    }}
                  >
                    {post.title}
                  </p>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                    }}
                  >
                    {(() => {
                      const url = (post as any).post_url as string | undefined;
                      if (url) {
                        const match = url.match(/\/r\/([^/]+)/);
                        if (match) return `r/${match[1]}`;
                      }
                      return post.platform;
                    })()}
                    {" "}· {post.score?.toFixed(1)}
                  </span>

                  {post.body && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#374151",
                        lineHeight: "1.4",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {post.body}
                    </p>
                  )}

                  {hasSubScores && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginTop: "6px",
                      }}
                    >
                      <MiniScoreBox label="C" value={commentary} />
                      <MiniScoreBox label="V" value={visual} />
                      <MiniScoreBox label="R" value={virality} />
                      <MiniScoreBox label="T" value={topical} />
                    </div>
                  )}

                  {pitch && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        marginTop: "4px",
                        fontStyle: "italic",
                        lineHeight: "1.3",
                        borderLeft: "2px solid #3b82f6",
                        paddingLeft: "6px",
                      }}
                    >
                      {pitch}
                    </p>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(post.id)}
                  style={{
                    padding: "8px 10px",
                    color: "#d1d5db",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#d1d5db")
                  }
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
