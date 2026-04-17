# NotionViz

## Business
**Client:** Internal team, expanding to public
**Industry:** Productivity SaaS / Developer tools — global

## User
**End user:** Advanced Notion users (power users, workspace admins, ops teams)
**Need:** Understand, navigate, and edit database relationships across their Notion workspace — without manually clicking through every database to trace connections

## Stack
- **Next.js** — frontend + API routes (Server Components default)
- **Supabase** — auth (Notion OAuth), user data, persisted graph state
- **Vercel** — hosting + edge functions
- **React Flow** — force-directed interactive graph (Obsidian-style)
- **shadcn + Tailwind** — UI components and styling
- **Inngest** — background workspace sync jobs

## EIID

### Enrichment (data)
**Have:** Notion API — databases, properties, relation fields, rollups, last-edited timestamps
**Missing:** Workspace-level health metadata (orphaned databases, relation symmetry, usage frequency)
**Connect:** Notion OAuth (workspace scope), incremental sync on workspace change

### Inference (patterns)
**Detect:** Orphaned databases (no inbound or outbound relations), over-connected hubs, one-way relations that likely need a reverse
**Predict:** Impact of deleting a database — what breaks downstream?
**Flag:** Duplicate database structures, circular dependencies, unused databases

### Interpretation (insights)
**Surface:** "3 databases have no relations", "CRM → Projects is one-way — add reverse?", "These 5 databases form a cluster with no outside connections"
**Frame as:** Graph health score, impact analysis before changes, actionable recommendations

### Delivery (reach)
**Channels:** Web app (primary), embeddable widget for Notion pages (stretch)
**Triggers:** User opens app, manual re-sync, Notion webhook on workspace change
**Timing:** On-demand + optional scheduled health digest

## Build or Buy
**Buy:** Notion API client, OAuth flow, graph rendering (React Flow), hosting, DB
**Enhance:** Relation editing — give users visual write-back on top of Notion's existing API
**Build:** Interactive force-directed graph with live edit, workspace health engine, schema planning mode (design before you build)

## Technology Constraints
- Use **npm**, NOT pnpm, yarn, bun.
- Use **React Flow (`@xyflow/react`)** for graph rendering, NOT D3, Cytoscape, or vis.js.
- Use **shadcn + Tailwind v4**, NOT MUI, Chakra, or Radix directly.
- Use **Supabase (`@supabase/supabase-js` + `@supabase/ssr`)** for auth and DB, NOT Prisma, Drizzle, or raw Postgres.
- Use **Inngest** for background jobs and workflows, NOT BullMQ, cron, or custom queues.
- Use **`@notionhq/client`** for Notion API, NOT fetch directly.

## Code Architecture
- No source file over 200 lines. Split by responsibility.
- One component per file. One utility per file.
- Colocation: tests next to source, types next to usage.
- Prefer composition over inheritance.
- If a module has two distinct modes, split into separate files.

## Design System
**Framework:** shadcn + Tailwind v4
**Style:** base-nova, neutral
**Token source:** globals.css
**Direction:** atlas at night — dark canvas, glowing violet nodes, traced paths. Technical but calm.
**Typography:** Space Grotesk (display) + DM Sans (body)
**Color character:** deep space blue-gray canvas, violet primary, amber accent
**Signature:** pill-shaped database nodes that glow on selection
**Theme swap:** remove `dark` from `<html>` for Notion-style light theme — tokens are pre-configured in `:root`
