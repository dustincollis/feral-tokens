# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Feral Tokens is a content ingestion engine for a YouTube channel about AI culture. It scrapes Reddit, scores posts with Claude, and generates episode scripts. The dashboard provides curation UI with AI-powered collections and script generation.

## Monorepo Structure

Turborepo monorepo with four workspaces:

- **packages/ingestion** — Reddit scraper + AI scoring pipeline (deployed on Railway)
- **packages/api** — Hono REST API server (deployed on Railway)
- **packages/shared** — Shared types + Supabase client
- **apps/dashboard** — Next.js frontend (deployed on Vercel)

## Run Locally

```bash
# Ingestion (one-shot scrape + score)
cd packages/ingestion && npx tsx --env-file=../../.env src/index.ts

# API server
cd packages/api && npx tsx src/index.ts

# Dashboard
cd apps/dashboard && npm run dev

# Monorepo-wide
npm run build      # Build all workspaces
npm run lint       # Lint all workspaces
```

No test framework is configured.

## Key Files

- `packages/ingestion/src/scoring/prompt.ts` — 4-dimension scoring prompt
- `packages/ingestion/src/scoring/pipeline.ts` — Batch scoring with images
- `packages/ingestion/src/scoring/parse.ts` — Sub-score parser
- `packages/api/src/routes/collections.ts` — Opus episode lineup suggestions
- `packages/api/src/routes/generate.ts` — Opus script generation
- `packages/api/src/index.ts` — API route registration
- `apps/dashboard/src/app/page.tsx` — Main layout with tabs
- `apps/dashboard/src/components/inbox/PostCard.tsx` — Post card with scores
- `apps/dashboard/src/components/builder/EpisodeBuilder.tsx` — Episode builder
- `apps/dashboard/src/components/collections/CollectionsPanel.tsx` — AI collections
- `apps/dashboard/src/components/shared/ImageLightbox.tsx` — Image zoom
- `apps/dashboard/src/lib/api.ts` — Dashboard API client

## Data Flow

1. **Ingestion**: Reddit adapter scrapes subreddits → normalize to `UnifiedPost` → dedup via SHA-256 hash → image processing (Sharp thumbnails) → Supabase `posts` table as `pending_score`
2. **Scoring**: `scoring/pipeline.ts` sends posts (with base64 images) to Claude Sonnet in batches of 8 → scores on 4 dimensions (commentary, visual, virality, topical) → extracts structured scores + pitch + category
3. **Collections**: Opus suggests episode lineups from scored posts via `api/routes/collections.ts`
4. **Script Generation**: Opus generates full episode scripts via `api/routes/generate.ts`

## Architecture Notes

- **Database**: Supabase (PostgreSQL + storage). Key columns on `posts`: `score`, `score_commentary`, `score_visual`, `score_virality`, `score_topical`, `pitch`, `category`, `status`, `thumbnail_url`, `post_url`. `sources` table holds Reddit subreddit configs.
- **AI Models**: Anthropic Claude via `@anthropic-ai/sdk` — Sonnet for scoring, Opus for collections + scripts.
- **Styling**: All inline styles in dashboard (Tailwind v4 conflict workaround — do not use Tailwind utility classes).
- **Auth**: API routes use a shared `API_SECRET_TOKEN` Bearer token.
- **Environment**: See `.env.example` for required variables.
