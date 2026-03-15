"use client";

import { UnifiedPost } from "@feral-tokens/shared";

interface PostCardProps {
  post: UnifiedPost;
  selected: boolean;
  onSelect: (post: UnifiedPost) => void;
}

export function PostCard({ post, selected, onSelect }: PostCardProps) {
  const score = post.score ?? 0;
  const scoreColor = score >= 8 ? "#22c55e" : score >= 6 ? "#eab308" : score >= 4 ? "#f97316" : "#ef4444";

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
      }}
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          style={{ width: "100%", height: "auto", display: "block" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "80px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "12px" }}>
          No image
        </div>
      )}
      <div style={{ padding: "12px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "white", backgroundColor: scoreColor, padding: "2px 8px", borderRadius: "999px" }}>
            {score.toFixed(1)}
          </span>
          {post.category && (
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", backgroundColor: "#f3f4f6", color: "#374151" }}>
              {post.category}
            </span>
          )}
        </div>
        <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px", lineHeight: "1.4" }}>{post.title}</p>
        {post.body && (
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>
            {post.body}
          </p>
        )}
        <p style={{ fontSize: "12px", color: "#6b7280" }}>{post.platform}</p>
        {post.score_data && (
          <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", fontStyle: "italic" }}>
            {(post.score_data as any).reason}
          </p>
        )}
      </div>
    </div>
  );
}