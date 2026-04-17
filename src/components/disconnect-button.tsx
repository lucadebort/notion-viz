'use client'

import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const RESET_DELAY_MS = 3000

export function DisconnectButton() {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), RESET_DELAY_MS)
    return () => clearTimeout(t)
  }, [confirming])

  if (confirming) {
    return (
      <a
        href="/api/auth/notion/disconnect"
        className="confirm-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium leading-none cursor-pointer transition-colors duration-150"
        aria-label="Confirm disconnect"
      >
        <LogOut size={10} />
        Confirm
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
      aria-label="Change workspace"
    >
      <LogOut size={13} />
    </button>
  )
}
