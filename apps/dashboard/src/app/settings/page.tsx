"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { triggerScrape, getScrapeStatus } from "@/lib/api";

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

export default function SettingsPage() {
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
    // Clear any existing poll for this source
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
          // Refresh sources to get updated last_scraped_at
          if (log.status === "done") fetchSources();
        }
      } catch {
        // Keep polling on fetch errors
      }
    }, 2000);
  }, []);

  async function handleScrape(sourceId: string) {
    setScraping(sourceId);
    // Clear any previous result for this source
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "32px" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      <div style={{ maxWidth: "896px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Settings</h1>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
              Manage sources and trigger scrapes
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
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
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
            Loading sources...
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
