import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";
import { runIngestion } from "@feral-tokens/ingestion";

export const scrapeRoute = new Hono();

// Trigger a scrape for a single source
scrapeRoute.post("/", async (c) => {
  const body = await c.req.json();
  const { source_id } = body;

  if (!source_id) {
    return c.json({ error: "source_id is required" }, 400);
  }

  const { data: source, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", source_id)
    .single();

  if (error || !source) {
    return c.json({ error: "Source not found" }, 404);
  }

  const { data: log } = await supabase
    .from("scrape_logs")
    .insert({ source_id, status: "running" })
    .select()
    .single();

  // Run ingestion in background, update log when done
  runIngestion(source_id)
    .then(async (result) => {
      console.log(`[scrape] Ingestion completed for ${source.name}:`, result);
      if (log) {
        const { error: updateErr } = await supabase
          .from("scrape_logs")
          .update({
            status: "completed",
            posts_found: result.total_inserted + result.total_skipped,
            posts_inserted: result.total_inserted,
            posts_skipped: result.total_skipped,
            error: result.errors.length > 0 ? result.errors.join("; ") : null,
            completed_at: new Date().toISOString(),
          })
          .eq("id", log.id);
        if (updateErr) console.error(`[scrape] Failed to update log:`, updateErr);
      }
    })
    .catch(async (err) => {
      console.error(`[scrape] Ingestion failed for ${source.name}:`, err);
      if (log) {
        const { error: updateErr } = await supabase
          .from("scrape_logs")
          .update({
            status: "failed",
            error: String(err?.message ?? err),
            completed_at: new Date().toISOString(),
          })
          .eq("id", log.id);
        if (updateErr) console.error(`[scrape] Failed to update log:`, updateErr);
      }
    });

  return c.json({
    message: "Scrape triggered",
    source: source.name,
    log_id: log?.id ?? null,
  });
});

// Poll scrape status by log ID
scrapeRoute.get("/status/:logId", async (c) => {
  const logId = c.req.param("logId");

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (error || !data) {
    return c.json({ error: "Log not found" }, 404);
  }

  return c.json(data);
});
