'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { NOTION_COLORS, type NotionColor } from '@/app/api/database/types'
import type { PropertyDraft } from './property-row'
import type { DatabaseNode } from '@/lib/notion/workspace'

const NUMBER_FORMATS: { value: string; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'number_with_commas', label: 'Number with commas' },
  { value: 'percent', label: 'Percent' },
  { value: 'dollar', label: 'Dollar ($)' },
  { value: 'euro', label: 'Euro (€)' },
  { value: 'pound', label: 'Pound (£)' },
  { value: 'yen', label: 'Yen (¥)' },
  { value: 'ruble', label: 'Ruble (₽)' },
  { value: 'rupee', label: 'Rupee (₹)' },
  { value: 'won', label: 'Won (₩)' },
  { value: 'yuan', label: 'Yuan (CN¥)' },
  { value: 'canadian_dollar', label: 'Canadian dollar (CA$)' },
  { value: 'real', label: 'Real (R$)' },
  { value: 'lira', label: 'Lira (₺)' },
  { value: 'franc', label: 'Franc (Fr)' },
  { value: 'krona', label: 'Krona (kr)' },
]

type OptionRowProps = {
  opt: { name: string; color: NotionColor }
  onColorChange: (color: NotionColor) => void
  onNameChange: (name: string) => void
  onRemove: () => void
}

function OptionRow({ opt, onColorChange, onNameChange, onRemove }: OptionRowProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn('notion-color-dot shrink-0 focus-visible:outline-none', `nc-${opt.color ?? 'default'}`)}
          aria-label="Pick color"
        />
        <PopoverContent className="w-auto p-1.5" side="bottom" align="start">
          <div className="flex gap-0.5">
            {NOTION_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onColorChange(c); setOpen(false) }}
                className={cn('notion-color-dot', `nc-${c}`, opt.color === c && 'ring-1 ring-foreground ring-offset-1')}
                aria-label={c}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={opt.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Option name"
        className="h-6 sub-config-text flex-1"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
      >
        <X size={10} />
      </button>
    </div>
  )
}

type Props = {
  prop: PropertyDraft
  databases: DatabaseNode[]
  onChange: (updated: PropertyDraft) => void
}

export function PropertySubConfig({ prop, databases, onChange }: Props) {
  if (prop.type === 'number') {
    return (
      <select
        value={prop.numberFormat ?? 'number'}
        onChange={(e) => onChange({ ...prop, numberFormat: e.target.value })}
        className="h-6 px-2 rounded-md border border-border bg-muted sub-config-text text-muted-foreground cursor-pointer w-full"
      >
        {NUMBER_FORMATS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
    )
  }

  if (prop.type === 'select' || prop.type === 'multi_select') {
    const options = prop.selectOptions ?? []
    return (
      <div className="flex flex-col gap-1">
        {options.map((opt, i) => (
          <OptionRow
            key={i}
            opt={opt}
            onColorChange={(color) => {
              const next = [...options]
              next[i] = { ...opt, color }
              onChange({ ...prop, selectOptions: next })
            }}
            onNameChange={(name) => {
              const next = [...options]
              next[i] = { ...opt, name }
              onChange({ ...prop, selectOptions: next })
            }}
            onRemove={() => onChange({ ...prop, selectOptions: options.filter((_, j) => j !== i) })}
          />
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...prop, selectOptions: [...options, { name: '', color: 'default' }] })}
          className="flex items-center gap-1 sub-config-text text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus size={9} /> Add option
        </button>
      </div>
    )
  }

  if (prop.type === 'relation') {
    return (
      <div className="flex flex-col gap-1.5">
        <select
          value={prop.relationDatabaseId ?? ''}
          onChange={(e) => onChange({ ...prop, relationDatabaseId: e.target.value })}
          className="h-6 px-2 rounded-md border border-border bg-muted sub-config-text text-muted-foreground cursor-pointer w-full"
        >
          <option value="">Pick database…</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon ? `${db.icon} ` : ''}{db.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 sub-config-text text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={prop.isTwoWay ?? false}
            onChange={(e) => onChange({ ...prop, isTwoWay: e.target.checked })}
            className="cursor-pointer"
          />
          Two-way (adds reverse property to target database)
        </label>
      </div>
    )
  }

  if (prop.type === 'formula') {
    return (
      <Input
        value={prop.formulaExpression ?? ''}
        onChange={(e) => onChange({ ...prop, formulaExpression: e.target.value })}
        placeholder='e.g. prop("Price") * prop("Quantity")'
        className="h-6 sub-config-text font-mono w-full"
      />
    )
  }

  if (prop.type === 'unique_id') {
    return (
      <Input
        value={prop.uniqueIdPrefix ?? ''}
        onChange={(e) => onChange({ ...prop, uniqueIdPrefix: e.target.value || undefined })}
        placeholder="Prefix (optional, e.g. ITEM)"
        className="h-6 sub-config-text w-full"
        maxLength={10}
      />
    )
  }

  return null
}
