CREATE TABLE saved_collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id    text NOT NULL UNIQUE,
  name        text NOT NULL,
  post_ids    uuid[] NOT NULL DEFAULT '{}',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
