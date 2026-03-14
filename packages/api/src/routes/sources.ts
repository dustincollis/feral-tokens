import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";

export const sourcesRoute = new Hono();

sourcesRoute.get("/", async (c) => {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return c.json({ error: "Failed to fetch sources" }, 500);
  }

  return c.json({ sources: data });
});

sourcesRoute.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const { data, error } = await supabase
    .from("sources")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to update source" }, 500);
  }

  return c.json({ source: data });
});

sourcesRoute.post("/", async (c) => {
  const body = await c.req.json();

  const { data, error } = await supabase
    .from("sources")
    .insert(body)
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to create source" }, 500);
  }

  return c.json({ source: data });
});