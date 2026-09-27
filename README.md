# ChangeMind

ChangeMind is an AI-powered engineering coordination platform that understands how code changes affect repositories, teams, and dependent systems. It detects changes, analyzes their impact, creates Change Capsules, and helps teams safely validate and integrate changes.

## Architecture

```text
Next.js application
        |
     Supabase
  (Auth, PostgreSQL, RLS,
   workspaces, projects, repositories, changes)
        |
   GitHub App
 (repository connection, installation, push webhooks)
        |
     Inngest
 (background and change processing)
        |
Change Capsules -> ChangeMind Impact Graph -> ChangeMind Agent -> Validation / PR / Integration
```

The application has two deliberately separate modes:

- Production mode reads authenticated workspace and project data from Supabase.
- Demo mode provides deterministic local data when Supabase is not configured, so the Change Capsules, ChangeMind Impact Graph, ChangeMind Agent, ChangeMind Workspace, approvals, and validation UI remain explorable.

## Current capabilities

- Supabase authentication, profiles, workspaces, workspace membership, projects, repositories, and row-level security.
- Project-scoped dashboard routes for code, changes, capsules, impact, agent, and approvals.
- A complete product UI and deterministic demo workflow for change coordination.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure Supabase in `.env.local` for production mode:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Future server-side integration credentials belong only in `.env.local`:

```dotenv
GITHUB_APP_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_SLUG=
```

Never expose secrets through `NEXT_PUBLIC_*` variables.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Integration boundaries

GitHub App, webhook ingestion, and Inngest processing are intentionally not implemented during this cleanup. Add each behind a server-side boundary, then persist changes and processing state in Supabase. The UI contracts and demo mode are kept separate from those future production adapters.
