'use client'

import { BaseEdge, getBezierPath, useInternalNode, Position } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { useGraphHover } from '@/components/graph-hover-context'

type SchemaEdgeData = {
  propertyId: string
  isTwoWay: boolean
}

export function SchemaEdge({ id, source, target, data, style, markerEnd, markerStart }: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { propertyId, isTwoWay } = (data ?? {}) as Partial<SchemaEdgeData>
  if (!propertyId) return null

  const { hoveredPropertyId } = useGraphHover()
  const isHighlighted = hoveredPropertyId === propertyId

  // Determine whether to exit from right or left based on horizontal positions
  const sourceAbsX = sourceNode.internals.positionAbsolute.x
  const targetAbsX = targetNode.internals.positionAbsolute.x
  const exitRight = sourceAbsX <= targetAbsX

  // Find the right handle on the source node
  const sourceHandleId = exitRight ? propertyId : `${propertyId}-l`
  const targetHandleId = exitRight ? null : 'target-r'  // null = default left handle

  const sourceHandles = sourceNode.internals.handleBounds?.source ?? []
  const targetHandles = targetNode.internals.handleBounds?.target ?? []

  const srcHandle = sourceHandles.find((h) => h.id === sourceHandleId) ?? sourceHandles[0]
  const tgtHandle = targetHandleId
    ? targetHandles.find((h) => h.id === targetHandleId) ?? targetHandles[0]
    : targetHandles.find((h) => !h.id || h.id === null) ?? targetHandles[0]

  if (!srcHandle || !tgtHandle) return null

  const sx = sourceNode.internals.positionAbsolute.x + srcHandle.x + srcHandle.width / 2
  const sy = sourceNode.internals.positionAbsolute.y + srcHandle.y + srcHandle.height / 2
  const tx = targetNode.internals.positionAbsolute.x + tgtHandle.x + tgtHandle.width / 2
  const ty = targetNode.internals.positionAbsolute.y + tgtHandle.y + tgtHandle.height / 2

  const sourcePosition = exitRight ? Position.Right : Position.Left
  const targetPosition = exitRight ? Position.Left : Position.Right

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition,
    targetX: tx,
    targetY: ty,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={cn(isTwoWay && 'two-way', isHighlighted && 'highlighted')}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
    />
  )
}
