# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Feral Tokens is a content ingestion engine for a YouTube channel about AI culture. It scrapes Reddit (and other platforms), scores posts with Claude, and generates episode scripts. The dashboard provides curation UI with AI-powered collections and script generation.

## Monorepo Structure

Turborepo monorepo with four workspaces:

- **packages/ingestion** — Reddit/YouTube/X scraper + AI scoring pipeline (deployed on Railway)
- **packages/api** — Hono REST API server (deployed on Railway)
- **packages/shared** — Shared types (`UnifiedPost`, `SourceConfig`, `Platform`), Supabase client singleton, utilities (`hashContent`, `retry`)
- **apps/dashboard** — Next.js 16 frontend with React 19 (deployed on Vercel)

## Commands

```bash
# Ingestion (one-shot scrape + score)
cd packages/ingestion && npx tsx --env-file=../../.env src/index.ts

# API server (port 3001)
cd packages/api && npx tsx src/index.ts

# Dashboard (port 3000)
cd apps/dashboard && npm run dev

# Monorepo-wide
npm run build      # Build all workspaces
npm run lint       # Lint all workspaces
```

No test framework is configured.

## Architecture

### Data Flow

1. **Scrape**: Platform adapters (`adapters/reddit.ts`, `youtube.ts`, `x.ts`) implement `SourceAdapter` interface → fetch raw posts since `last_scraped_at`
2. **Normalize + Dedup**: Convert to `UnifiedPost` with SHA-256 content hash → check duplicates by hash and `external_id`
3. **Images**: Sharp resizes to 400px JPEG thumbnail → uploads original + thumbnail to Supabase `post-images` bucket
4. **Score**: `scoring/pipeline.ts` sends posts (with base64 thumbnails) to Claude Sonnet in batches of 8 → 4 dimensions (commentary 35%, visual 30%, virality 20%, topical 15%) → composite score recomputed by parser (not trusting model math) → pitch generated only for score ≥ 7.0
5. **Collections**: Opus suggests episode lineups from scored posts
6. **Script Generation**: Opus generates full episode scripts with detailed system prompt

### API Routes (packages/api)

All routes mounted under `/api/*` on Hono. Auth via `Authorization: Bearer API_SECRET_TOKEN`.

- `POST /api/scrape` — triggers `runIngestion()` imported from ingestion package; `GET /api/scrape/status/:logId` polls progress
- `POST /api/score` — manual re-scoring of individual posts
- `POST /api/generate` — episode script generation (Opus)
- `POST /api/collections` — AI-suggested episode lineups (supports Anthropic and xAI providers)
- `GET|PUT|POST /api/sources` — CRUD for source configs
- `/api/saved-collections` — CRUD for saved collections (auto-generates short_id like SC-001)

### Dashboard Layout

- Left panel: 4-tab UI (Inbox, Collections, Saved, Script) with tab content
- Right sidebar: Episode Builder (always visible, ~25% width)
- Inbox lazy-loads posts in batches of 50 with infinite scroll

### Cross-Package Imports

Workspaces use `@feral-tokens/ingestion`, `@feral-tokens/api`, `@feral-tokens/shared` namespaces. The API package imports `runIngestion` directly from the ingestion package to trigger scrapes via HTTP.

### Supabase Client Pattern

- **Ingestion + API**: Use `SUPABASE_SERVICE_KEY` (full permissions, no RLS) via shared singleton
- **Dashboard**: Uses `SUPABASE_ANON_KEY` (client-side, RLS enforced) for real-time subscriptions

### Database

Supabase PostgreSQL. Key tables: `posts` (content + scores + status), `sources` (platform configs), `scrape_logs` (audit trail), `episodes` (drafts), `saved_collections`. Post status lifecycle: `pending_score` → `scored` → `featured`/`rejected`. Schema in `supabase/schema.sql`.

## Critical Constraints

- **Styling**: Dashboard uses ONLY inline React style objects. Do NOT use Tailwind utility classes — there is a Tailwind v4 conflict with the Next.js setup that breaks class-based styling.
- **AI Models**: Sonnet for scoring (batch pipeline), Opus for collections + script generation. Both via `@anthropic-ai/sdk`.
- **Environment**: Root `.env` file loaded via `--env-file` flag for ingestion. Dashboard uses `NEXT_PUBLIC_` prefix for client-side vars (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_TOKEN`). See `.env.example` for all required variables.
