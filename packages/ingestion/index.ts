import pino from "pino";
import { supabase } from "@feral-tokens/shared";
import { RedditAdapter } from "./adapters/reddit";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

async function main() {
  logger.info("Starting ingestion run");

  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("enabled", true);

  if (error) {
    logger.error({ error }, "Failed to fetch sources");
    process.exit(1);
  }

  if (!sources || sources.length === 0) {
    logger.info("No enabled sources found");
    process.exit(0);
  }

  for (const source of sources) {
    logger.info({ source: source.name }, "Processing source");
    const since = source.last_scraped_at
      ? new Date(source.last_scraped_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      if (source.platform === "reddit") {
        const adapter = new RedditAdapter();
        const posts = await adapter.fetch(source, since);
        logger.info({ source: source.name, count: posts.length }, "Fetched posts");
      }
    } catch (err) {
      logger.error({ err, source: source.name }, "Adapter failed");
    }

    await supabase
      .from("sources")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", source.id);
  }

  logger.info("Ingestion run complete");
}

main();