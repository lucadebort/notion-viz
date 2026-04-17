'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PropIcon, PROPERTY_TYPE_META } from '@/components/prop-icon'
import { cn } from '@/lib/utils'

const CREATABLE_TYPES = [
  'rich_text',
  'number',
  'select',
  'multi_select',
  'date',
  'checkbox',
  'url',
  'email',
  'phone_number',
  'status',
  'relation',
] as const

type Props = {
  value: string
  onChange: (type: string) => void
}

export function PropertyTypeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const meta = PROPERTY_TYPE_META[value]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex items-center gap-1.5 px-2 h-7 rounded-md border border-border',
          'text-[11px] text-muted-foreground bg-muted hover:bg-muted/80',
          'transition-colors duration-100 cursor-pointer whitespace-nowrap shrink-0'
        )}
      >
        <PropIcon type={value} size={11} />
        <span>{meta?.label ?? value}</span>
        <ChevronDown size={10} className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        {CREATABLE_TYPES.map((type) => {
          const m = PROPERTY_TYPE_META[type]
          return (
            <button
              key={type}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[11px] cursor-pointer',
                'hover:bg-muted transition-colors duration-100',
                value === type && 'bg-muted font-medium'
              )}
              onClick={() => { onChange(type); setOpen(false) }}
            >
              <PropIcon type={type} size={11} />
              {m?.label ?? type}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
