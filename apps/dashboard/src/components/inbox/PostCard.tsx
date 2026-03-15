"use client";

import { UnifiedPost } from "@feral-tokens/shared";

interface PostCardProps {
  post: UnifiedPost;
  selected: boolean;
  onSelect: (post: UnifiedPost) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  companion: { bg: "#ede9fe", text: "#6d28d9" },
  behavior: { bg: "#fef3c7", text: "#92400e" },
  humor: { bg: "#fce7f3", text: "#9d174d" },
  creepy: { bg: "#fde2e2", text: "#991b1b" },
  culture: { bg: "#dbeafe", text: "#1e40af" },
  other: { bg: "#f3f4f6", text: "#374151" },
  // Legacy categories
  funny: { bg: "#fce7f3", text: "#9d174d" },
  concerning: { bg: "#fde2e2", text: "#991b1b" },
  meta: { bg: "#dbeafe", text: "#1e40af" },
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const barColor =
    value >= 8 ? "#22c55e" : value >= 6 ? "#eab308" : value >= 4 ? "#f97316" : "#dc2626";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span
        style={{
          fontSize: "10px",
          color: "#9ca3af",
          width: "12px",
          textAlign: "right",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "4px",
          backgroundColor: "#f3f4f6",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "10px", color: "#6b7280", width: "16px" }}>
        {value}
      </span>
    </div>
  );
}

export function PostCard({ post, selected, onSelect }: PostCardProps) {
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

  // Read sub-scores from dedicated columns, fall back to score_data for legacy
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
      onClick={() => onSelect(post)}
      style={{
        cursor: "pointer",
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
      {/* Thumbnail */}
      {post.thumbnail_url ? (
        <div
          style={{
            width: "240px",
            minWidth: "240px",
            maxWidth: "240px",
            backgroundColor: "#f3f4f6",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={post.thumbnail_url}
            alt={post.title}
            style={{
              width: "240px",
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
            width: "240px",
            minWidth: "240px",
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

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "10px 12px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
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
          <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
            {post.platform}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: "14px",
            fontWeight: "600",
            lineHeight: "1.4",
            color: "#111827",
          }}
        >
          {post.title}
        </p>

        {/* Body - original post text */}
        {post.body && (
          <p
            style={{
              fontSize: "13px",
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

        {/* Sub-scores */}
        {hasSubScores && (
          <div
            style={{
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <ScoreBar label="C" value={commentary} />
            <ScoreBar label="V" value={visual} />
            <ScoreBar label="R" value={virality} />
            <ScoreBar label="T" value={topical} />
          </div>
        )}

        {/* Pitch (AI-generated segment angle) */}
        {pitch && (
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "4px",
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
  );
}
