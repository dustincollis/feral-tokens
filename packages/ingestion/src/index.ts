import pino from "pino";
import { supabase } from "@feral-tokens/shared";
import { RedditAdapter } from "./adapters/reddit";
import { YouTubeAdapter } from "./adapters/youtube";
import { XAdapter } from "./adapters/x";
import { normalizePost } from "./normalizer/normalize";
import { isDuplicate } from "./normalizer/dedup";
import { processImage } from "./normalizer/images";
import { runScoringPipeline } from "./scoring/pipeline";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const ADAPTERS: Record<string, any> = {
  reddit: RedditAdapter,
  youtube: YouTubeAdapter,
  x: XAdapter,
};

export interface IngestionResult {
  sources_processed: number;
  total_inserted: number;
  total_skipped: number;
  errors: string[];
}

/**
 * Run ingestion for one source or all enabled sources.
 * Returns a summary of what happened.
 */
export async function runIngestion(sourceId?: string): Promise<IngestionResult> {
  logger.info({ sourceId }, "Starting ingestion run");

  const result: IngestionResult = {
    sources_processed: 0,
    total_inserted: 0,
    total_skipped: 0,
    errors: [],
  };

  let query = supabase.from("sources").select("*").eq("enabled", true);
  if (sourceId) query = query.eq("id", sourceId);

  const { data: sources, error } = await query;

  if (error) {
    logger.error({ error }, "Failed to fetch sources");
    throw new Error("Failed to fetch sources");
  }

  if (!sources || sources.length === 0) {
    logger.info("No enabled sources found");
    return result;
  }

  for (const source of sources) {
    logger.info({ source: source.name }, "Processing source");

    const since = source.last_scraped_at
      ? new Date(source.last_scraped_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const AdapterClass = ADAPTERS[source.platform];
    if (!AdapterClass) {
      logger.warn({ platform: source.platform }, "No adapter found");
      continue;
    }

    try {
      const adapter = new AdapterClass();
      const rawPosts = await adapter.fetch(source, since);
      logger.info({ source: source.name, count: rawPosts.length }, "Fetched posts");

      let inserted = 0;
      let skipped = 0;

      for (const raw of rawPosts) {
        const normalized = normalizePost(raw);

        const duplicate = await isDuplicate(
          normalized.content_hash,
          normalized.source_id,
          normalized.external_id
        );

        if (duplicate) {
          skipped++;
          continue;
        }

        if (normalized.image_url) {
          const processed = await processImage(
            normalized.image_url,
            normalized.external_id,
            normalized.platform
          );
          if (processed) {
            normalized.image_url = processed.originalUrl;
            normalized.thumbnail_url = processed.thumbnailUrl;
          }
        }

        const { error: insertError } = await supabase
          .from("posts")
          .insert(normalized);

        if (insertError) {
          logger.error({ insertError }, "Failed to insert post");
        } else {
          inserted++;
        }
      }

      logger.info({ source: source.name, inserted, skipped }, "Source complete");
      result.sources_processed++;
      result.total_inserted += inserted;
      result.total_skipped += skipped;

      await supabase
        .from("sources")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", source.id);
    } catch (err: any) {
      logger.error({ err, source: source.name }, "Adapter failed");
      result.errors.push(`${source.name}: ${err.message}`);
    }
  }

  logger.info("Running scoring pipeline");
  await runScoringPipeline();

  logger.info("Ingestion run complete");
  return result;
}

// CLI entry point — run all sources when executed directly
const isDirectRun = process.argv[1]?.includes("ingestion");
if (isDirectRun) {
  runIngestion()
    .then((result) => {
      logger.info({ result }, "Done");
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, "Fatal error");
      process.exit(1);
    });
}