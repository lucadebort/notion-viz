import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  if (cookieStore.has('notion_access_token')) redirect('/graph')

  return (
    <main className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Subtle radial glow — color via CSS variable, no hardcoded values */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, var(--primary-glow) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center space-y-8 max-w-sm px-6">
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground font-heading">
            NotionViz
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Your Notion workspace as a living graph.
            <br />
            See every database, every relation, all at once.
          </p>
        </div>

        <a
          href="/api/auth/notion"
          className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_20px_var(--primary-glow)]"
        >
          Connect Notion workspace
        </a>

        <p className="text-xs text-muted-foreground/60">
          Read-only access. No data stored.
        </p>
      </div>
    </main>
  )
}
