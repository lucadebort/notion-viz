'use client'

import dynamic from 'next/dynamic'
import data from '@emoji-mart/data'
import { useTheme } from 'next-themes'

// Lazy-load the heavy picker bundle
const Picker = dynamic(() => import('@emoji-mart/react').then((m) => m.default ?? m), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-24 form-text text-muted-foreground">Loading…</div>,
})

type Props = {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: Props) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <Picker
      data={data}
      onEmojiSelect={(e: { native: string }) => onSelect(e.native)}
      theme={theme}
      set="native"
      previewPosition="none"
      skinTonePosition="none"
      navPosition="bottom"
      perLine={8}
    />
  )
}
