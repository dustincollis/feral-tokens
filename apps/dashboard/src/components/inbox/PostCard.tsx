"use client";

import { useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { ImageLightbox } from "@/components/shared/ImageLightbox";

interface PostCardProps {
  post: UnifiedPost;
  selected: boolean;
  onSelect: (post: UnifiedPost) => void;
  collectionIds?: string[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  companion: { bg: "#ede9fe", text: "#6d28d9" },
  behavior: { bg: "#fef3c7", text: "#92400e" },
  humor: { bg: "#fce7f3", text: "#9d174d" },
  creepy: { bg: "#fde2e2", text: "#991b1b" },
  culture: { bg: "#dbeafe", text: "#1e40af" },
  other: { bg: "#f3f4f6", text: "#374151" },
  funny: { bg: "#fce7f3", text: "#9d174d" },
  concerning: { bg: "#fde2e2", text: "#991b1b" },
  meta: { bg: "#dbeafe", text: "#1e40af" },
};

function ScoreBox({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "#22c55e" : value >= 6 ? "#eab308" : value >= 4 ? "#f97316" : "#dc2626";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        flex: 1,
      }}
    >
      <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500 }}>
        {label}
      </span>
      <div
        style={{
          width: "100%",
          padding: "4px 0",
          borderRadius: "4px",
          backgroundColor: color + "18",
          border: `1px solid ${color}40`,
          textAlign: "center",
          fontSize: "13px",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function PostCard({ post, selected, onSelect, collectionIds }: PostCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const score = post.score ?? 0;
  const scoreColor =
    score >= 8
      ? "#22c55e"
      : score >= 6
        ? "#eab308"
        : score >= 4
          ? "#f97316"
          : "#ef4444";

  const catColors = CATEGORY_COLORS[post.category ?? "other"] ?? CATEGORY_COLORS.other;

  const sd = post.score_data as any;
  const commentary = (post as any).score_commentary ?? sd?.commentary ?? null;
  const visual = (post as any).score_visual ?? sd?.visual ?? null;
  const virality = (post as any).score_virality ?? sd?.virality ?? null;
  const topical = (post as any).score_topical ?? sd?.topical ?? null;
  const pitch = (post as any).pitch ?? sd?.pitch ?? null;

  const hasSubScores =
    commentary !== null && visual !== null && virality !== null && topical !== null;

  return (
    <>
      <div
        style={{
          borderRadius: "8px",
          border: selected ? "2px solid #3b82f6" : "2px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "12px",
          backgroundColor: "white",
          boxShadow: selected ? "0 4px 6px rgba(0,0,0,0.1)" : "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        {/* Thumbnail - click to zoom */}
        {post.thumbnail_url ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            style={{
              width: "320px",
              minWidth: "320px",
              maxWidth: "320px",
              backgroundColor: "#f3f4f6",
              overflow: "hidden",
              flexShrink: 0,
              cursor: "zoom-in",
            }}
          >
            <img
              src={post.thumbnail_url}
              alt={post.title}
              style={{
                width: "320px",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "320px",
              minWidth: "320px",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d1d5db",
              fontSize: "11px",
              flexShrink: 0,
            }}
          >
            No image
          </div>
        )}

        {/* Content - click to add/remove from episode */}
        <div
          onClick={() => onSelect(post)}
          style={{
            flex: 1,
            padding: "10px 12px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            cursor: "pointer",
          }}
        >
          {/* Top row: badges */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                color: "white",
                backgroundColor: scoreColor,
                padding: "1px 8px",
                borderRadius: "999px",
              }}
            >
              {score.toFixed(1)}
            </span>
            {post.category && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 8px",
                  borderRadius: "999px",
                  backgroundColor: catColors.bg,
                  color: catColors.text,
                  fontWeight: 500,
                }}
              >
                {post.category}
              </span>
            )}
            {collectionIds && collectionIds.map((cid) => (
              <span
                key={cid}
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontWeight: 600,
                }}
              >
                {cid}
              </span>
            ))}
            <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
              {(() => {
                const url = (post as any).post_url as string | undefined;
                if (url) {
                  const match = url.match(/\/r\/([^/]+)/);
                  if (match) return `r/${match[1]}`;
                }
                return post.platform;
              })()}
            </span>
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: "20px",
              fontWeight: "600",
              lineHeight: "1.4",
              color: "#111827",
            }}
          >
            {post.title}
          </p>

          {/* Body */}
          {post.body && (
            <p
              style={{
                fontSize: "18px",
                color: "#374151",
                lineHeight: "1.5",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              {post.body}
            </p>
          )}

          {/* Spacer */}
          <div style={{ marginTop: "12px" }} />

          {/* Sub-scores */}
          {hasSubScores && (
            <div style={{ display: "flex", gap: "8px" }}>
              <ScoreBox label="Commentary" value={commentary} />
              <ScoreBox label="Visual" value={visual} />
              <ScoreBox label="Virality" value={virality} />
              <ScoreBox label="Topical" value={topical} />
            </div>
          )}

          {/* Pitch */}
          {pitch && (
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "8px",
                fontStyle: "italic",
                lineHeight: "1.4",
                borderLeft: "2px solid #3b82f6",
                paddingLeft: "8px",
              }}
            >
              {pitch}
            </p>
          )}

          {/* Legacy reason */}
          {!pitch && !hasSubScores && sd?.reason && (
            <p
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              {sd.reason}
            </p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && post.thumbnail_url && (
        <ImageLightbox
          src={post.thumbnail_url}
          alt={post.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
