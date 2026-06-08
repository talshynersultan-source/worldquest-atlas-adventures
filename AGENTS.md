# Deployment Rules

This project is a TanStack Start / Nitro SSR app built with Vite and React. The Vercel deployment must build the SSR output, not just a static `dist` folder.

## Repository Checks

- Work from the project root: `C:\Users\User\Documents\world quiz\worldquest-atlas-adventures`.
- The expected remote is `https://github.com/talshynersultan-source/worldquest-atlas-adventures.git`.
- Before editing, check the current branch and confirm you are not in an old duplicate clone.

## Vercel Build Settings

- Root Directory: project root.
- Framework Preset: Other.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: leave empty in the dashboard; the TanStack/Nitro build should produce `.vercel/output`.
- Package manager: npm. This repo contains both `package-lock.json` and `bun.lock`, so Vercel must be pinned to npm to avoid using Bun accidentally.
- Keep `vercel.json` if Vercel would otherwise choose the wrong package manager or deploy a static folder.

## Environment Safety

- Never commit `.env`, `.env.local`, `.env.*.local`, `VERCEL_ENV_IMPORT.local.env`, or `VERCEL_ENV_VALUES.local.md`.
- Keep `.env.example` committed with variable names only and no real values.
- Never print real secrets in chat, logs, docs, or committed files.
- Browser-exposed variables must use `VITE_` and must only contain public values.

## Supabase

- Supabase project ref: `ysumwujijzmqribptero`.
- Supabase URL format: `https://PROJECT_REF.supabase.co`, with no `/rest/v1`.
- `SUPABASE_URL`: server-side base project URL.
- `SUPABASE_PUBLISHABLE_KEY`: anon/public key for server-side authenticated Supabase calls.
- `VITE_SUPABASE_URL`: same project URL, exposed to the browser.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: same anon/public key, exposed to the browser.
- `VITE_SUPABASE_PROJECT_ID`: public project ref.
- `SUPABASE_SERVICE_ROLE_KEY`: secret backend/server-only key. Never add a `VITE_` prefix and never use it in client code.
- Only require the service-role key for trusted backend admin actions that must bypass RLS. For normal user profile/progress reads and writes, use the anon/public key with authenticated RLS.

## Migrations

- Migrations are SQL files that create or update database tables.
- The Supabase project ref is the part before `.supabase.co` in `https://PROJECT_REF.supabase.co`.
- This app needs the `profiles` and `user_progress` tables from `supabase/migrations`.
- If Supabase reports `Could not find the table ... in the schema cache`, apply the SQL migrations to the target Supabase project.
- If Supabase CLI is available and the user is logged in, use `supabase link --project-ref ysumwujijzmqribptero` and `supabase db push`.
- If CLI login or the database password is missing, use the Supabase Dashboard SQL Editor and run the migration SQL files in timestamp order.
- Quiz content is local in `src/lib/levels.ts`; Supabase does not need starter quiz rows for normal play.

## Gemini / AI Keys

- `GEMINI_API_KEY` is secret backend/server-only. Never expose it as `VITE_GEMINI_API_KEY`.
- `GEMINI_MODEL` should default to `gemini-2.5-flash-lite` for student projects unless the user explicitly asks for another model.
- Do not add Gemini variables unless the code actually uses Gemini or the student asks for AI features.

## Before Deploy

- Confirm `git remote -v`, current branch, and project folder.
- Confirm `.env` files are ignored and not tracked by git.
- Confirm `.env.example` lists required variable names without values.
- Confirm Vercel env vars are added for Production, Preview, and Development.
- Run `npm ci` if dependencies need refreshing, then `npm run build`.
- Confirm the build creates `.vercel/output`.
- Commit and push deployment-related changes only after the build passes.
