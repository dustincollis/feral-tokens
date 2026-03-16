"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { triggerScrape, getScrapeStatus } from "@/lib/api";
import { UnifiedPost } from "@feral-tokens/shared";

interface Source {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
  last_scraped_at: string | null;
  health_status: string;
  config: Record<string, unknown>;
}

interface ScrapeJob {
  logId: string;
  status: "running" | "done" | "error";
  result?: any;
}

const PAGE_SIZE = 50;

const tabStyle = (active: boolean) => ({
  fontSize: "14px",
  fontWeight: active ? 600 : 400,
  color: active ? "#111827" : "#6b7280",
  padding: "8px 16px",
  borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
  background: "none",
  border: "none",
  borderBottomWidth: "2px",
  borderBottomStyle: "solid" as const,
  borderBottomColor: active ? "#3b82f6" : "transparent",
  cursor: "pointer",
});

export default function SettingsPage() {
  const [tab, setTab] = useState<"sources" | "hidden">("sources");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "32px" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      <div style={{ maxWidth: "896px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Settings</h1>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
              Manage sources and hidden posts
            </p>
          </div>
          <a
            href="/"
            style={{
              fontSize: "13px",
              backgroundColor: "#f3f4f6",
              padding: "8px 16px",
              borderRadius: "6px",
              color: "#374151",
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </a>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "24px",
          }}
        >
          <button onClick={() => setTab("sources")} style={tabStyle(tab === "sources")}>
            Sources
          </button>
          <button onClick={() => setTab("hidden")} style={tabStyle(tab === "hidden")}>
            Hidden Posts
          </button>
        </div>

        {tab === "sources" ? <SourcesTab /> : <HiddenPostsTab />}
      </div>
    </div>
  );
}

/* ─── Sources Tab ─── */

function SourcesTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Record<string, ScrapeJob>>({});
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    fetchSources();
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
    };
  }, []);

  async function fetchSources() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .order("name");
    if (!error && data) setSources(data as Source[]);
    setLoading(false);
  }

  const startPolling = useCallback((sourceId: string, logId: string) => {
    if (pollTimers.current[sourceId]) {
      clearInterval(pollTimers.current[sourceId]);
    }

    setJobs((prev) => ({
      ...prev,
      [sourceId]: { logId, status: "running" },
    }));

    pollTimers.current[sourceId] = setInterval(async () => {
      try {
        const log = await getScrapeStatus(logId);
        if (log.status === "done" || log.status === "error") {
          clearInterval(pollTimers.current[sourceId]);
          delete pollTimers.current[sourceId];
          setJobs((prev) => ({
            ...prev,
            [sourceId]: {
              logId,
              status: log.status as "done" | "error",
              result: log.result,
            },
          }));
          if (log.status === "done") fetchSources();
        }
      } catch {
        // Keep polling on fetch errors
      }
    }, 2000);
  }, []);

  async function handleScrape(sourceId: string) {
    setScraping(sourceId);
    setJobs((prev) => {
      const next = { ...prev };
      delete next[sourceId];
      return next;
    });
    try {
      const resp = await triggerScrape(sourceId);
      if (resp.log_id) {
        startPolling(sourceId, resp.log_id);
      }
    } catch {
      setJobs((prev) => ({
        ...prev,
        [sourceId]: { logId: "", status: "error", result: { error: "Failed to trigger scrape" } },
      }));
    } finally {
      setScraping(null);
    }
  }

  async function handleScrapeAll() {
    setScraping("all");
    try {
      for (const source of sources.filter((s) => s.enabled)) {
        const resp = await triggerScrape(source.id);
        if (resp.log_id) {
          startPolling(source.id, resp.log_id);
        }
      }
    } catch {
      // Individual source errors handled by polling
    } finally {
      setScraping(null);
    }
  }

  async function handleToggle(source: Source) {
    await supabase
      .from("sources")
      .update({ enabled: !source.enabled })
      .eq("id", source.id);
    fetchSources();
  }

  function renderJobStatus(sourceId: string) {
    const job = jobs[sourceId];
    if (!job) return null;

    if (job.status === "running") {
      return (
        <span
          style={{
            fontSize: "11px",
            color: "#3b82f6",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "inline-block",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          Scraping...
        </span>
      );
    }

    if (job.status === "done") {
      const r = job.result;
      const inserted = r?.total_inserted ?? 0;
      const skipped = r?.total_skipped ?? 0;
      return (
        <span style={{ fontSize: "11px", color: "#16a34a" }}>
          Done — {inserted} new, {skipped} skipped
        </span>
      );
    }

    if (job.status === "error") {
      const msg = job.result?.error ?? "Unknown error";
      return (
        <span style={{ fontSize: "11px", color: "#dc2626" }}>
          Error: {msg}
        </span>
      );
    }

    return null;
  }

  const healthColor = (status: string) =>
    status === "healthy" ? "#22c55e" : status === "degraded" ? "#eab308" : "#ef4444";

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
        Loading sources...
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button
          onClick={handleScrapeAll}
          disabled={scraping !== null}
          style={{
            fontSize: "13px",
            backgroundColor: scraping !== null ? "#d1d5db" : "#3b82f6",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: scraping !== null ? "default" : "pointer",
            fontWeight: 500,
          }}
        >
          {scraping === "all" ? "Triggering..." : "Scrape All Sources"}
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {sources.map((source, i) => (
          <div
            key={source.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderTop: i > 0 ? "1px solid #e5e7eb" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: healthColor(source.health_status),
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 500, color: "#111827" }}>{source.name}</p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "2px" }}>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {source.platform}
                    {" · "}
                    {source.last_scraped_at
                      ? `Last scraped ${new Date(source.last_scraped_at).toLocaleString()}`
                      : "Never scraped"}
                  </span>
                  {renderJobStatus(source.id)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => handleToggle(source)}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  border: source.enabled ? "1px solid #86efac" : "1px solid #d1d5db",
                  color: source.enabled ? "#15803d" : "#6b7280",
                  backgroundColor: source.enabled ? "#f0fdf4" : "#f9fafb",
                  cursor: "pointer",
                }}
              >
                {source.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                onClick={() => handleScrape(source.id)}
                disabled={scraping !== null || jobs[source.id]?.status === "running"}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor:
                    scraping !== null || jobs[source.id]?.status === "running"
                      ? "#e5e7eb"
                      : "#f3f4f6",
                  color: "#374151",
                  cursor:
                    scraping !== null || jobs[source.id]?.status === "running"
                      ? "default"
                      : "pointer",
                }}
              >
                {jobs[source.id]?.status === "running" ? "Scraping..." : "Scrape Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Hidden Posts Tab ─── */

function HiddenPostsTab() {
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scored")
      .eq("dismissed", true)
      .order("score", { ascending: false })
      .range(0, PAGE_SIZE - 1);
    if (!error && data) {
      setPosts(data as UnifiedPost[]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scored")
      .eq("dismissed", true)
      .order("score", { ascending: false })
      .range(posts.length, posts.length + PAGE_SIZE - 1);
    if (!error && data) {
      setPosts((prev) => [...prev, ...(data as UnifiedPost[])]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, posts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMore();
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  async function handleUnhide(postId: string) {
    await supabase.from("posts").update({ dismissed: false }).eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
        Loading hidden posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
        No hidden posts
      </div>
    );
  }

  const scoreColor = (score: number) =>
    score >= 8 ? "#22c55e" : score >= 6 ? "#eab308" : score >= 4 ? "#f97316" : "#ef4444";

  return (
    <div>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
        {posts.length}{hasMore ? "+" : ""} hidden posts
      </p>
      <div
        ref={scrollRef}
        style={{
          maxHeight: "calc(100vh - 260px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {posts.map((post) => {
          const score = post.score ?? 0;
          return (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              {post.thumbnail_url && (
                <img
                  src={post.thumbnail_url}
                  alt=""
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 500,
                    color: "#111827",
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {post.title}
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: scoreColor(score),
                    }}
                  >
                    {score.toFixed(1)}
                  </span>
                  {post.category && (
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>{post.category}</span>
                  )}
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>
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
              </div>
              <button
                onClick={() => handleUnhide(post.id)}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid #3b82f6",
                  backgroundColor: "white",
                  color: "#3b82f6",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontWeight: 500,
                }}
              >
                Unhide
              </button>
            </div>
          );
        })}
        {loadingMore && (
          <div style={{ textAlign: "center", padding: "12px", color: "#9ca3af", fontSize: "13px" }}>
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
