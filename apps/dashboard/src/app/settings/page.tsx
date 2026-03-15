"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { triggerScrape } from "@/lib/api";

interface Source {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
  last_scraped_at: string | null;
  health_status: string;
  config: Record<string, unknown>;
}

export default function SettingsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
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

  async function handleScrape(sourceId: string, sourceName: string) {
    setScraping(sourceId);
    setMessage(null);
    try {
      await triggerScrape(sourceId);
      setMessage(`Scrape triggered for ${sourceName}`);
    } catch (err) {
      setMessage(`Failed to trigger scrape for ${sourceName}`);
    } finally {
      setScraping(null);
    }
  }

  async function handleScrapeAll() {
    setScraping("all");
    setMessage(null);
    try {
      for (const source of sources.filter((s) => s.enabled)) {
        await triggerScrape(source.id);
      }
      setMessage("Scrape triggered for all enabled sources");
    } catch (err) {
      setMessage("Failed to trigger scrape for all sources");
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage sources and trigger scrapes</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
            >
              Back to Dashboard
            </a>
            <button
              onClick={handleScrapeAll}
              disabled={scraping !== null}
              className="text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
            >
              {scraping === "all" ? "Scraping..." : "Scrape All Sources"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading sources...</div>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      source.health_status === "healthy"
                        ? "bg-green-500"
                        : source.health_status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <p className="text-xs text-gray-400">
                      {source.platform} {source.last_scraped_at
                        ? `Last scraped ${new Date(source.last_scraped_at).toLocaleString()}`
                        : "Never scraped"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(source)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      source.enabled
                        ? "border-green-300 text-green-700 bg-green-50"
                        : "border-gray-300 text-gray-500 bg-gray-50"
                    }`}
                  >
                    {source.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => handleScrape(source.id, source.name)}
                    disabled={scraping !== null}
                    className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-3 py-1 rounded"
                  >
                    {scraping === source.id ? "Scraping..." : "Scrape Now"}
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