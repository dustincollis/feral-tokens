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
      if (log) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "done",
            result,
            finished_at: new Date().toISOString(),
          })
          .eq("id", log.id);
      }
    })
    .catch(async (err) => {
      if (log) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "error",
            result: { error: err.message },
            finished_at: new Date().toISOString(),
          })
          .eq("id", log.id);
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
