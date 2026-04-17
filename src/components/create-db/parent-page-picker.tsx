'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PageResult } from '@/app/api/pages/search/route'

type Props = {
  value: PageResult | null
  onChange: (page: PageResult | null) => void
}

export function ParentPagePicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PageResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open) return

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pages/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.pages ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, open])

  if (value) {
    return (
      <button
        type="button"
        onClick={() => { onChange(null); setQuery('') }}
        className="flex items-center gap-2 w-full px-2 h-8 rounded-md border border-border bg-muted text-[11px] text-foreground cursor-pointer hover:bg-muted/80 transition-colors"
      >
        {value.icon && <span>{value.icon}</span>}
        <span className="flex-1 text-left truncate">{value.title}</span>
        <span className="text-muted-foreground text-[10px]">change</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search pages…"
        className="h-8 text-[11px]"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {loading && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">No pages found</p>
          )}
          {results.map((page) => (
            <button
              key={page.id}
              type="button"
              onMouseDown={() => onChange(page)}
              className="flex items-center gap-2 w-full px-3 py-2 text-[11px] hover:bg-muted transition-colors cursor-pointer"
            >
              {page.icon && <span>{page.icon}</span>}
              <span className="truncate">{page.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
