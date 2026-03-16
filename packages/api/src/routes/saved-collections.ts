import { Hono } from "hono";
import { supabase } from "@feral-tokens/shared";

const savedCollectionsRoute = new Hono();

// Generate next short_id like SC-001, SC-002, etc.
async function nextShortId(): Promise<string> {
  const { data } = await supabase
    .from("saved_collections")
    .select("short_id")
    .order("short_id", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return "SC-001";

  const last = data[0].short_id;
  const num = parseInt(last.replace("SC-", ""), 10);
  return `SC-${String(num + 1).padStart(3, "0")}`;
}

// List all saved collections (newest first)
savedCollectionsRoute.get("/", async (c) => {
  const { data, error } = await supabase
    .from("saved_collections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Post-map: { post_id: ["SC-001", ...] }
savedCollectionsRoute.get("/post-map", async (c) => {
  const { data, error } = await supabase
    .from("saved_collections")
    .select("short_id, post_ids");

  if (error) return c.json({ error: error.message }, 500);

  const map: Record<string, string[]> = {};
  for (const col of data ?? []) {
    for (const pid of col.post_ids ?? []) {
      if (!map[pid]) map[pid] = [];
      map[pid].push(col.short_id);
    }
  }
  return c.json(map);
});

// Get one + full post objects
savedCollectionsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { data: collection, error } = await supabase
    .from("saved_collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !collection) return c.json({ error: "Not found" }, 404);

  // Fetch full post objects
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .in("id", collection.post_ids ?? []);

  // Preserve order from post_ids
  const postMap = new Map((posts ?? []).map((p) => [p.id, p]));
  const orderedPosts = (collection.post_ids ?? [])
    .map((id: string) => postMap.get(id))
    .filter(Boolean);

  return c.json({ ...collection, posts: orderedPosts });
});

// Create
savedCollectionsRoute.post("/", async (c) => {
  const body = await c.req.json();
  const short_id = await nextShortId();

  const { data, error } = await supabase
    .from("saved_collections")
    .insert({
      short_id,
      name: body.name,
      post_ids: body.post_ids ?? [],
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// Update
savedCollectionsRoute.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.post_ids !== undefined) updates.post_ids = body.post_ids;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from("saved_collections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Delete
savedCollectionsRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase
    .from("saved_collections")
    .delete()
    .eq("id", id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

export { savedCollectionsRoute };
