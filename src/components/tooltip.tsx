'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  children: ReactNode
  className?: string
}

export function Tooltip({ label, children, className }: Props) {
  return (
    <div className={cn('relative group/tip', className)}>
      {children}
      <div
        role="tooltip"
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-foreground text-background text-[10px] leading-none whitespace-nowrap pointer-events-none select-none z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-300"
      >
        {label}
      </div>
    </div>
  )
}
