# QueryLab — SQL Query Playground & Visualizer

**Write. Run. Understand. Optimize.**

QueryLab is a full-stack SQL workspace for students, developers, and data analysts. Write and execute SQL queries safely, visualize results, get AI assistance, and track your progress — all in one place.

## Features

- **Interactive SQL editor** — Monaco-based editor with syntax highlighting, formatting, and Ctrl+Enter execution
- **Safe query execution** — Read-only SELECT enforcement via AST parsing, statement timeouts, and row limits
- **Results grid** — Sortable, paginated, filterable data grid with NULL styling
- **Chart visualization** — Bar, line, and pie charts with automatic recommendations from result data
- **Query history** — Every execution tracked with timing, row counts, and status
- **Saved queries** — Organize, tag, favorite, and reuse queries
- **Data explorer** — Browse seeded e-commerce, education, and business datasets
- **AI assistant** — Generate, explain, debug, and optimize SQL via Google Gemini
- **Export** — CSV, JSON, SQL download, and summary reports
- **Supabase persistence** — Auth, saved queries, history, and workspaces with RLS

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No* | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | No* | Server-only Supabase key |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GEMINI_MODEL` | No | Override model (default: `gemini-2.5-flash`) |
| `SQL_EXECUTION_DATABASE_URL` | No | Isolated PostgreSQL for real execution |
| `SQL_EXECUTION_READONLY_DATABASE_URL` | No | Read-only connection URL |
| `NEXT_PUBLIC_APP_URL` | No | App URL for auth redirects |

\* When Supabase is not configured, the app runs in **demo mode** with local storage. When `SQL_EXECUTION_DATABASE_URL` is not set, queries run against a built-in in-memory demo engine.

## Project Structure

```
src/
  app/
    (app)/              # Authenticated app routes
      dashboard/        # Dashboard with analytics
      playground/       # SQL editor + results
      history/          # Query history
      saved-queries/    # Saved query management
      datasets/         # Data explorer
      ai-assistant/     # AI SQL assistant
    api/
      ai/sql/          # Gemini AI endpoint
      query/execute/    # SQL execution endpoint
      query/history/    # History CRUD endpoint
    login/              # Sign in
    signup/             # Sign up
    page.tsx            # Landing page
  components/
    layout/             # App shell, sidebar
    playground/         # Editor, results, schema, charts, AI panel
    ui/                 # Button, card, badge, input, toast, skeleton
  lib/
    ai/                 # Gemini integration + validation
    exports/            # CSV/JSON/report export
    sql/                # Validator, demo engine, executor, schema
    supabase/           # Client + server Supabase helpers
    store/              # Local storage (demo mode)
    utils/              # Shared utilities
    validation/         # Zod schemas
  types/                # TypeScript types
supabase/
  migrations/           # Database schema + RLS
  seed.sql              # Demo dataset seed
tests/
  unit/                 # Vitest unit tests
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/0001_init.sql` in the SQL editor
3. Configure auth redirect URLs: `http://localhost:3000`
4. Add environment variables to `.env.local`

## Gemini API Setup

1. Get an API key from [Google AI Studio](https://aistudio.google.com)
2. Add `GEMINI_API_KEY=your_key` to `.env.local`
3. Without a key, the AI assistant runs in demo mode with fallback responses

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run test       # Vitest unit tests
```

## Build Checklist

| Milestone | Status |
|-----------|--------|
| 1. Requirements & architecture | Done |
| 2. Next.js + Tailwind frontend UI | Done |
| 3. Supabase persistence | Code complete — awaiting credentials |
| 4. Gemini AI integration | Code complete — awaiting credentials |
| 5. Vercel deployment | Not deployed — credentials required |
| Interactive SQL editor | Done |
| Safe query execution | Done |
| Results grid + charts | Done |
| Query history | Done |
| Saved queries | Done |
| CSV/JSON exports | Done |
| Authentication + RLS | Code complete — awaiting Supabase |
| Automated tests | Done |
| Environment variable documentation | Done |
| Production build verification | Pending |

## License

MIT
"# QueryLAb" 
