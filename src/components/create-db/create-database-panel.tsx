'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PropertyRow, type PropertyDraft } from './property-row'
import { ParentPagePicker } from './parent-page-picker'
import type { DatabaseNode } from '@/lib/notion/workspace'
import type { PageResult } from '@/app/api/pages/search/route'

type Props = {
  databases: DatabaseNode[]
  onCreated: (db: DatabaseNode) => void
  onClose: () => void
}

let nextId = 1
function makeTempId() { return `prop-${nextId++}` }

export function CreateDatabasePanel({ databases, onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [parentPage, setParentPage] = useState<PageResult | null>(null)
  const [properties, setProperties] = useState<PropertyDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addProperty() {
    setProperties((prev) => [...prev, { tempId: makeTempId(), name: '', type: 'rich_text' }])
  }

  function updateProperty(tempId: string, updated: PropertyDraft) {
    setProperties((prev) => prev.map((p) => (p.tempId === tempId ? updated : p)))
  }

  function removeProperty(tempId: string) {
    setProperties((prev) => prev.filter((p) => p.tempId !== tempId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !parentPage) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPageId: parentPage.id,
          title: name.trim(),
          icon: icon.trim() || undefined,
          properties: properties.filter((p) => p.name.trim()),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create database')

      onCreated(data.database)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = name.trim().length > 0 && parentPage !== null && !loading

  return (
    <div className="panel-card absolute top-4 right-4 bottom-4 w-72 z-10 flex flex-col overflow-hidden rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-xs font-semibold font-heading">New Database</span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
        <div className="flex gap-2">
          <div className="shrink-0">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Icon</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🗂️"
              className="h-8 w-12 text-center text-base px-1"
              maxLength={2}
            />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Database name"
              className="h-8 text-[11px]"
              autoFocus
            />
          </div>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Parent page</Label>
          <ParentPagePicker value={parentPage} onChange={setParentPage} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Properties</Label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <span className="flex-1 px-2 h-7 rounded-md border border-border bg-muted text-[11px] text-foreground flex items-center">Name</span>
              <span className="px-2 h-7 rounded-md border border-border bg-muted text-[11px] text-muted-foreground flex items-center shrink-0">Title</span>
              <span className="w-6 h-6" />
            </div>
            {properties.map((prop) => (
              <PropertyRow
                key={prop.tempId}
                prop={prop}
                databases={databases}
                onChange={(updated) => updateProperty(prop.tempId, updated)}
                onRemove={() => removeProperty(prop.tempId)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addProperty}
            className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus size={11} />
            Add property
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-destructive">{error}</p>
        )}
      </form>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <Button
          type="submit"
          size="sm"
          className="w-full text-[11px] h-8"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading ? 'Creating…' : 'Create database'}
        </Button>
      </div>
    </div>
  )
}
