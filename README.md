# Maven Clinic

Next.js 16 starter workspace for the Maven Clinic hackathon MVP. The app includes patient onboarding, dashboard flows, symptom tracking with AI insight hooks, appointment booking, secure messaging, provider views, and employer analytics.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
Copy-Item .env.example .env.local
```

3. Fill in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (optional fallback-safe)
- `NEXT_PUBLIC_APP_URL`

4. Run the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` starts the local Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs ESLint.
- `npm run seed` seeds provider and employer demo data into Supabase.

## Supabase

- Run [schema.sql](D:\Maven Clinic\supabase\schema.sql) in the Supabase SQL editor first.
- Then run `npm run seed`.
- The seed script loads `.env.local` and requires `SUPABASE_SERVICE_ROLE_KEY`.

## Key Paths

- `src/app/(auth)` for auth and onboarding routes.
- `src/app/(dashboard)` for patient flows.
- `src/app/(provider)` for provider surfaces.
- `src/app/(employer)` for employer analytics.
- `src/lib/data.ts` for live-first data access with mock fallbacks.
- `src/lib/supabase` for browser/server/middleware Supabase helpers.

## Notes

- Anthropic integration falls back to a safe canned insight when `ANTHROPIC_API_KEY` is missing.
- Patient data pages prefer live Supabase reads and degrade to mock data only when tables or rows are unavailable.
