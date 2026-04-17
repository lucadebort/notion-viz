'use client'

import { createContext, useContext } from 'react'

type GraphHoverContextValue = {
  hoveredPropertyId: string | null
  hoveredEdgeTargets: Set<string>
  setHoveredPropertyId: (id: string | null) => void
}

export const GraphHoverContext = createContext<GraphHoverContextValue>({
  hoveredPropertyId: null,
  hoveredEdgeTargets: new Set(),
  setHoveredPropertyId: () => {},
})

export function useGraphHover() {
  return useContext(GraphHoverContext)
}
