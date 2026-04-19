'use client'

import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PropertyTypeSelect } from './property-type-select'
import { PropertySubConfig } from './property-sub-config'
import type { NotionColor } from '@/app/api/database/types'
import type { DatabaseNode } from '@/lib/notion/workspace'

export type PropertyDraft = {
  tempId: string
  name: string
  type: string
  // relation
  relationDatabaseId?: string
  isTwoWay?: boolean
  // number
  numberFormat?: string
  // select / multi_select
  selectOptions?: { name: string; color: NotionColor }[]
  // formula
  formulaExpression?: string
  // unique_id
  uniqueIdPrefix?: string
}

type Props = {
  prop: PropertyDraft
  databases: DatabaseNode[]
  onChange: (updated: PropertyDraft) => void
  onRemove: () => void
}

const TYPES_WITH_SUB_CONFIG = new Set([
  'number', 'select', 'multi_select', 'relation', 'formula', 'unique_id',
])

export function PropertyRow({ prop, databases, onChange, onRemove }: Props) {
  const hasSubConfig = TYPES_WITH_SUB_CONFIG.has(prop.type)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          value={prop.name}
          onChange={(e) => onChange({ ...prop, name: e.target.value })}
          placeholder="Property name"
          className="h-7 text-[11px] flex-1 min-w-0"
        />
        <PropertyTypeSelect
          value={prop.type}
          onChange={(type) => onChange({
            ...prop,
            type,
            // reset type-specific fields on type change
            relationDatabaseId: undefined,
            isTwoWay: undefined,
            numberFormat: undefined,
            selectOptions: undefined,
            formulaExpression: undefined,
            uniqueIdPrefix: undefined,
          })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-100 cursor-pointer"
          aria-label="Remove property"
        >
          <X size={11} />
        </button>
      </div>
      {hasSubConfig && (
        <div className="ml-2 pl-2 border-l border-border">
          <PropertySubConfig prop={prop} databases={databases} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
