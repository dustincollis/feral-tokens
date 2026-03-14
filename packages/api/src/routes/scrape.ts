import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";

export const scrapeRoute = new Hono();

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

  await supabase.from("scrape_logs").insert({
    source_id,
    status: "running",
  });

  return c.json({
    message: "Scrape triggered",
    source: source.name,
  });
});