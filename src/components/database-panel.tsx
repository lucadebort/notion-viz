'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Clock, Database, ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropIcon } from '@/components/prop-icon'
import type { DatabaseNode, RelationEdge } from '@/lib/notion/workspace'
import type { DatabaseEntriesResponse, SampleEntry } from '@/app/api/database/[id]/route'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

type EdgeInfo = {
  edge: RelationEdge
  sourceDb: DatabaseNode
  targetDb: DatabaseNode
}

type Props = {
  selectedDb: DatabaseNode | null
  selectedEdgeInfo: EdgeInfo | null
  databases: DatabaseNode[]
  edges: RelationEdge[]
}

function DbEntriesSection({ db }: { db: DatabaseNode }) {
  const [entries, setEntries] = useState<SampleEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/database/${db.id}`)
      .then((r) => r.json() as Promise<DatabaseEntriesResponse>)
      .then((data) => {
        setEntries(data.entries ?? [])
        setHasMore(data.hasMore ?? false)
      })
      .catch(() => { setEntries([]); setHasMore(false) })
      .finally(() => setLoading(false))
  }, [db.id])

  return (
    <section>
      <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
        Entries
      </h3>
      {loading ? (
        <div className="flex flex-col gap-1.5">
          {[1, 2, 3].map((i) => <div key={i} className="h-6 rounded bg-muted animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries found</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <a
              key={entry.id}
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-between gap-2 py-1 px-1.5 -mx-1.5 rounded',
                'text-xs text-foreground hover:bg-muted transition-colors duration-100 group'
              )}
            >
              <span className="truncate">{entry.title || 'Untitled'}</span>
              <ExternalLink size={9} className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
          {hasMore && (
            <a
              href={db.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors duration-100"
            >
              View all in Notion →
            </a>
          )}
        </div>
      )}
    </section>
  )
}

function DbBadge({ db }: { db: DatabaseNode }) {
  return (
    <a
      href={db.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border border-border',
        'bg-muted/40 hover:bg-muted transition-colors duration-150 group'
      )}
    >
      {db.icon && <span className="text-base leading-none shrink-0">{db.icon}</span>}
      <span className="text-sm font-medium text-foreground truncate flex-1 font-heading">{db.name}</span>
      <ExternalLink size={11} className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

export function DatabasePanel({ selectedDb, selectedEdgeInfo, databases, edges }: Props) {
  const dbMap = new Map(databases.map((d) => [d.id, d]))

  const inbound = selectedDb
    ? edges.filter((e) => e.target === selectedDb.id && e.source !== selectedDb.id)
    : []
  const outbound = selectedDb
    ? edges.filter((e) => e.source === selectedDb.id)
    : []

  const isEmpty = !selectedDb && !selectedEdgeInfo

  return (
    <aside
      className={cn(
        'absolute right-0 top-0 h-full z-20',
        'w-72 flex flex-col',
        'bg-card/90 backdrop-blur-md border-l border-border'
      )}
    >
      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted border border-border">
            <Database size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Click a database or a relation to explore
          </p>
        </div>
      )}

      {/* ── Edge / relation view ── */}
      {selectedEdgeInfo && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-muted-foreground shrink-0" />
              <h2 className="font-semibold text-sm text-foreground font-heading">Relation</h2>
              {selectedEdgeInfo.edge.isTwoWay && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  two-way
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {/* Source */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">From</span>
              <DbBadge db={selectedEdgeInfo.sourceDb} />
              <div className="flex items-center gap-2 px-1">
                <PropIcon type="relation" size={11} />
                <span className="text-xs text-foreground/80 truncate">
                  {selectedEdgeInfo.edge.propertyName}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              {selectedEdgeInfo.edge.isTwoWay ? (
                <ArrowLeftRight size={14} className="text-muted-foreground/60" />
              ) : (
                <ArrowRight size={14} className="text-muted-foreground/60" />
              )}
            </div>

            {/* Target */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">To</span>
              <DbBadge db={selectedEdgeInfo.targetDb} />
              {/* For two-way: find the reverse property in the target database */}
              {selectedEdgeInfo.edge.isTwoWay && (() => {
                const reverseProp = selectedEdgeInfo.targetDb.properties.find(
                  (p) => p.type === 'relation' && p.relationTargetId === selectedEdgeInfo.sourceDb.id
                )
                return reverseProp ? (
                  <div className="flex items-center gap-2 px-1">
                    <PropIcon type="relation" size={11} />
                    <span className="text-xs text-foreground/80 truncate">{reverseProp.name}</span>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Database view ── */}
      {selectedDb && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {selectedDb.icon && (
                    <span className="text-xl leading-none shrink-0">{selectedDb.icon}</span>
                  )}
                  <h2 className="font-semibold text-sm text-foreground truncate font-heading">
                    {selectedDb.name}
                  </h2>
                </div>
                {selectedDb.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {selectedDb.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={11} />
                <span>Edited {formatRelativeTime(selectedDb.lastEditedTime)}</span>
              </div>
              <a
                href={selectedDb.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <ExternalLink size={11} />
                <span>Open in Notion</span>
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
            {/* Connections */}
            {(inbound.length > 0 || outbound.length > 0) && (
              <section>
                <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                  Connections
                </h3>
                <div className="flex flex-col gap-1">
                  {outbound.map((e) => {
                    const target = dbMap.get(e.target)
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowRight size={11} className="shrink-0 text-muted-foreground/60" />
                        <span className="truncate">
                          <span className="text-foreground/80">{e.propertyName}</span>
                          {target && <span> → {target.icon} {target.name}</span>}
                          {e.isTwoWay && (
                            <span className="ml-1 text-[10px] text-muted-foreground/50">(two-way)</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                  {inbound.map((e) => {
                    const source = dbMap.get(e.source)
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowLeft size={11} className="shrink-0 text-muted-foreground/60" />
                        <span className="truncate">
                          {source && <span>{source.icon} {source.name}</span>}
                          <span className="text-foreground/80"> via {e.propertyName}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <DbEntriesSection db={selectedDb} />
          </div>
        </div>
      )}
    </aside>
  )
}
