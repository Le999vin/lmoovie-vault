# Movie Vault

Next.js (App Router) movie vault with TMDB search, Postgres + Drizzle, NextAuth, Tailwind/shadcn, and a LangChain agent that uses OpenRouter (OpenAI-compatible) to read/write your vault data.

## Getting started
1) Copy envs  
`cp .env.example .env.local`  
Set at minimum: `DATABASE_URL`, `TMDB_ACCESS_TOKEN`, `OPENROUTER_API_KEY`, `NEXTAUTH_SECRET`.  
Optional: `OPENROUTER_MODEL=mistralai/devstral-2512:free`, `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`.

2) Install deps  
`npm install`

3) Start Postgres (Docker)  
`docker-compose up -d`

4) Migrate + seed  
`npm run db:migrate`  
`npm run db:seed`

5) Dev server  
`npm run dev` (uses webpack to avoid Turbopack source-map noise; run `next dev --turbo` manually if you want Turbopack)

6) AI sanity check  
`curl -X GET http://localhost:3000/api/ai/ping`

## Commands
- `npm run dev` - start app (webpack dev)
- `npm run clean` - remove .next cache
- `npm run build` / `npm start` - production build/serve
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm test` - Vitest (needs DB + env)
- `npm run db:generate` - regen migrations from schema
- `npm run db:migrate` - apply migrations
- `npm run db:seed` - seed demo data
- `npm run db:studio` - Drizzle studio

## Environment
- `DATABASE_URL` - Postgres connection
- `TMDB_BASE_URL` (default `https://api.themoviedb.org/3`)
- `TMDB_ACCESS_TOKEN` - TMDB v4 bearer token
- `OPENROUTER_API_KEY` - server-only
- `OPENROUTER_MODEL` - e.g. `meta-llama/llama-3.1-8b-instruct:free`
- `OPENROUTER_BASE_URL` - default `https://openrouter.ai/api/v1`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `SINGLE_USER_EMAIL`/`SINGLE_USER_NAME`, optional `DEV_AUTH_PASSWORD`, `NEXT_PUBLIC_SINGLE_USER_EMAIL`

## Project structure
- `app/(site)/*` - pages (home, discover, watchlist, collections, ai) + layout
- `app/movie/[tmdbId]` - detail page with actions
- `app/api/*` - TMDB proxy, auth, watchlist/ratings/notes/collections, AI chat/ping
- `lib/db/*` - Drizzle client, schema, queries
- `lib/tmdb/*` - TMDB fetchers, sync helper
- `lib/ai/llm.ts` - OpenRouter LLM factory
- `components/*` - UI (shadcn), layout/nav, movie/action widgets, AI chat
- `scripts/seed.ts` - seed demo data
- `drizzle/*` - migrations
- `tests/*` - minimal DB + API route tests (Vitest)

## AI endpoints
- `GET /api/ai/ping` - quick OpenRouter sanity check
- `POST /api/ai/chat` - body `{ messages: [{ role, content }] }`, returns `{ text }` (requires session + OpenRouter env)

## Deployment
Configure env vars (TMDB, OpenRouter, NextAuth, Postgres). Ensure Postgres is reachable and `DATABASE_URL` points to it. No secrets are exposed to the client.
