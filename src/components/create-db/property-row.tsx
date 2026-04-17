'use client'

import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PropertyTypeSelect } from './property-type-select'
import type { DatabaseNode } from '@/lib/notion/workspace'

export type PropertyDraft = {
  tempId: string
  name: string
  type: string
  relationDatabaseId?: string
}

type Props = {
  prop: PropertyDraft
  databases: DatabaseNode[]
  onChange: (updated: PropertyDraft) => void
  onRemove: () => void
}

export function PropertyRow({ prop, databases, onChange, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={prop.name}
        onChange={(e) => onChange({ ...prop, name: e.target.value })}
        placeholder="Property name"
        className="h-7 text-[11px] flex-1 min-w-0"
      />
      <PropertyTypeSelect
        value={prop.type}
        onChange={(type) => onChange({ ...prop, type, relationDatabaseId: undefined })}
      />
      {prop.type === 'relation' && (
        <select
          value={prop.relationDatabaseId ?? ''}
          onChange={(e) => onChange({ ...prop, relationDatabaseId: e.target.value })}
          className="h-7 px-2 rounded-md border border-border bg-muted text-[11px] text-muted-foreground cursor-pointer flex-1 min-w-0"
        >
          <option value="">Pick database…</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon ? `${db.icon} ` : ''}{db.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-100 cursor-pointer"
        aria-label="Remove property"
      >
        <X size={11} />
      </button>
    </div>
  )
}
