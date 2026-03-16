"use client";

import { useEffect, useState } from "react";
import { UnifiedPost } from "@feral-tokens/shared";
import { listSavedCollections, getSavedCollection, deleteSavedCollection } from "@/lib/api";

interface SavedCollectionItem {
  id: string;
  short_id: string;
  name: string;
  post_ids: string[];
  notes: string | null;
  created_at: string;
}

interface SavedCollectionsPanelProps {
  onLoadCollection: (posts: UnifiedPost[]) => void;
  refreshKey: number;
}

export function SavedCollectionsPanel({ onLoadCollection, refreshKey }: SavedCollectionsPanelProps) {
  const [collections, setCollections] = useState<SavedCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, [refreshKey]);

  async function fetchCollections() {
    setLoading(true);
    try {
      const data = await listSavedCollections();
      setCollections(data);
    } catch (err) {
      console.error("Failed to fetch saved collections:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      const data = await getSavedCollection(id);
      onLoadCollection(data.posts);
    } catch (err) {
      console.error("Failed to load collection:", err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSavedCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        Loading saved collections...
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" }}>
        No saved collections yet. Use the Save button in the Episode Builder.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {collections.map((col) => (
        <div
          key={col.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px 16px",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#92400e",
              backgroundColor: "#fef3c7",
              padding: "2px 8px",
              borderRadius: "999px",
              flexShrink: 0,
            }}
          >
            {col.short_id}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
              {col.name}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
              {col.post_ids.length} posts · {new Date(col.created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              onClick={() => handleLoad(col.id)}
              disabled={loadingId === col.id}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "none",
                cursor: loadingId === col.id ? "default" : "pointer",
                backgroundColor: loadingId === col.id ? "#d1d5db" : "#3b82f6",
                color: "white",
                fontWeight: 500,
              }}
            >
              {loadingId === col.id ? "Loading..." : "Load"}
            </button>
            {confirmDeleteId === col.id ? (
              <>
                <button
                  onClick={() => handleDelete(col.id)}
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontWeight: 500,
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    backgroundColor: "white",
                    color: "#6b7280",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(col.id)}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  backgroundColor: "white",
                  color: "#6b7280",
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
