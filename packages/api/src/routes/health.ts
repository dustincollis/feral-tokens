import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";

export const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  const { error } = await supabase.from("sources").select("id").limit(1);

  return c.json({
    status: error ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: error ? "down" : "healthy",
    },
  });
});