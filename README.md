# Maven Clinic

Next.js 16 starter workspace with TypeScript, Tailwind CSS v4, and a basic Supabase client helper.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
Copy-Item .env.example .env.local
```

3. Fill in your Supabase values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Start the development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` starts the local Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs ESLint.

## Project Structure

```text
src/
  app/            App Router entrypoints and route UI
  lib/            Shared helpers and integrations
public/           Static assets
```

## Supabase

- Environment parsing lives in `src/lib/env.ts`.
- Browser client creation lives in `src/lib/supabase/client.ts`.
- The client helper throws early if required environment variables are missing.

## Suggested Next Work

- Replace `src/app/page.tsx` with the first real feature route.
- Add feature folders under `src/` as product areas become clear.
- Introduce server-side Supabase helpers if you need authenticated server rendering or route handlers.
# Maven-Clinic
