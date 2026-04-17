'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className={cn('w-7 h-7', className)} />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-full',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors duration-150 cursor-pointer',
        className
      )}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
