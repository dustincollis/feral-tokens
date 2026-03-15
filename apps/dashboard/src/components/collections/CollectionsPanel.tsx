"use client";

import { UnifiedPost } from "@feral-tokens/shared";
import {
  CollectionsResult,
  generateCollections,
  CollectionOptions,
} from "@/lib/api";
import { useState } from "react";
import {
  ProviderOption,
  PROVIDER_OPTIONS,
} from "@/components/builder/EpisodeBuilder";

interface CollectionsPanelProps {
  onLoadCollection: (posts: UnifiedPost[]) => void;
  selectedProvider: ProviderOption;
  onProviderChange: (option: ProviderOption) => void;
}

export function CollectionsPanel({
  onLoadCollection,
  selectedProvider,
  onProviderChange,
}: CollectionsPanelProps) {
  const [result, setResult] = useState<CollectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateCollections({
        provider: selectedProvider.provider,
        model: selectedProvider.model,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate collections");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>
            Collections
          </h2>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              fontSize: "13px",
              backgroundColor: loading ? "#d1d5db" : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "6px 16px",
              cursor: loading ? "default" : "pointer",
              fontWeight: 500,
            }}
          >
            {loading ? "Thinking..." : "Suggest Lineups"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "12px", color: "#9ca3af" }}>Model:</label>
          <select
            value={`${selectedProvider.provider}:${selectedProvider.model}`}
            onChange={(e) => {
              const option = PROVIDER_OPTIONS.find(
                (o) => `${o.provider}:${o.model}` === e.target.value
              );
              if (option) onProviderChange(option);
            }}
            style={{
              fontSize: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "2px 8px",
              backgroundColor: "white",
              color: "#374151",
            }}
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
        <p style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.4" }}>
          AI reviews all scored posts and suggests episode lineups: a weekly
          roundup plus themed collections.
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fef2f2",
              borderRadius: "6px",
              color: "#991b1b",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {!result && !loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#9ca3af",
              fontSize: "13px",
            }}
          >
            Click "Suggest Lineups" to get started
          </div>
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#9ca3af",
              fontSize: "13px",
            }}
          >
            Opus is reviewing your posts...
          </div>
        )}

        {result && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Weekly Roundup */}
            <CollectionCard
              title={result.weekly_roundup.title}
              angle={result.weekly_roundup.angle}
              posts={result.weekly_roundup.posts}
              accentColor="#3b82f6"
              label="Weekly Roundup"
              onLoad={() =>
                onLoadCollection(result.weekly_roundup.posts as UnifiedPost[])
              }
            />

            {/* Themed Collections */}
            {result.themed.map((collection, i) => (
              <CollectionCard
                key={i}
                title={collection.title}
                angle={collection.angle}
                posts={collection.posts}
                accentColor="#7c3aed"
                label="Themed"
                onLoad={() =>
                  onLoadCollection(collection.posts as UnifiedPost[])
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionCard({
  title,
  angle,
  posts,
  accentColor,
  label,
  onLoad,
}: {
  title: string;
  angle: string;
  posts: any[];
  accentColor: string;
  label: string;
  onLoad: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "white",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>
              {posts.length} posts
            </span>
          </div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>
            {angle}
          </p>
        </div>
        <button
          onClick={onLoad}
          style={{
            fontSize: "12px",
            backgroundColor: accentColor,
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Load
        </button>
      </div>

      {/* Post list */}
      <div style={{ padding: "8px 16px" }}>
        {posts.map((post, idx) => (
          <div
            key={post.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 0",
              borderBottom:
                idx < posts.length - 1 ? "1px solid #f9fafb" : "none",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#d1d5db",
                fontFamily: "monospace",
                width: "16px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </span>
            {post.thumbnail_url && (
              <img
                src={post.thumbnail_url}
                alt=""
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#374151",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {post.title}
              </p>
              {post.pitch && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    fontStyle: "italic",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {post.pitch}
                </p>
              )}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color:
                  post.score >= 8
                    ? "#22c55e"
                    : post.score >= 6
                      ? "#eab308"
                      : "#f97316",
                flexShrink: 0,
              }}
            >
              {post.score?.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
