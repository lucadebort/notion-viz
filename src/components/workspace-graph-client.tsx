'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { WorkspaceGraph } from './workspace-graph'

// React Flow produces floating-point transforms that differ between SSR and
// client, causing hydration mismatches. Disable SSR here in a Client Component
// (the only place next/dynamic ssr:false is permitted).
const WorkspaceGraphNoSSR = dynamic(
  () => import('./workspace-graph').then((m) => m.WorkspaceGraph),
  { ssr: false }
)

export function WorkspaceGraphClient(props: ComponentProps<typeof WorkspaceGraph>) {
  return <WorkspaceGraphNoSSR {...props} />
}
