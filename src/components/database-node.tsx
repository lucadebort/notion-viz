'use client'

import { Fragment } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { PropIcon } from '@/components/prop-icon'
import { useGraphHover } from '@/components/graph-hover-context'
import type { PropertyInfo } from '@/lib/notion/workspace'
import { NODE_WIDTH, NODE_HEADER_H, NODE_ROW_H } from '@/lib/graph/layout'

type NodeData = {
  icon: string | null
  name: string
  properties: PropertyInfo[]
}

const HIDDEN_HANDLE_STYLE = {
  opacity: 0,
  pointerEvents: 'none' as const,
}

export function DatabaseNodeComponent({ id, data, selected }: NodeProps) {
  const { icon, name, properties } = data as NodeData
  const { hoveredPropertyId, hoveredEdgeTargets, setHoveredPropertyId } = useGraphHover()
  const isHoveredTarget = hoveredEdgeTargets.has(id)

  return (
    <div
      className={cn(
        'rounded-xl border text-xs overflow-visible',
        'transition-colors duration-150 cursor-pointer select-none',
        'bg-node-bg border-node-border text-foreground',
        selected && 'ring-1 ring-node-ring border-transparent shadow-node-glow',
        !selected && isHoveredTarget && 'node-hover-target'
      )}
      style={{ width: NODE_WIDTH }}
    >
      {/* ── Target handles — invisible, kept for edge routing ── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: NODE_HEADER_H / 2, left: -4, width: 6, height: 6, position: 'absolute', ...HIDDEN_HANDLE_STYLE }}
      />
      <Handle
        type="target"
        id="target-r"
        position={Position.Right}
        style={{ top: NODE_HEADER_H / 2, right: -4, width: 6, height: 6, position: 'absolute', ...HIDDEN_HANDLE_STYLE }}
      />

      {/* ── Source handles (left + right) per relation property — invisible, for edge routing ── */}
      {properties.map((prop, i) =>
        prop.type === 'relation' ? (
          <Fragment key={prop.id}>
            <Handle
              type="source"
              id={prop.id}
              position={Position.Right}
              style={{ top: NODE_HEADER_H + i * NODE_ROW_H + NODE_ROW_H / 2, right: -4, width: 6, height: 6, position: 'absolute', ...HIDDEN_HANDLE_STYLE }}
            />
            <Handle
              type="source"
              id={`${prop.id}-l`}
              position={Position.Left}
              style={{ top: NODE_HEADER_H + i * NODE_ROW_H + NODE_ROW_H / 2, left: -4, width: 6, height: 6, position: 'absolute', ...HIDDEN_HANDLE_STYLE }}
            />
          </Fragment>
        ) : null
      )}

      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 font-medium border-b border-node-border"
        style={{ height: NODE_HEADER_H }}
      >
        {icon && <span className="text-sm leading-none shrink-0">{icon}</span>}
        <span className="font-sans font-semibold truncate text-[12px]">{name}</span>
      </div>

      {/* ── Property rows ── */}
      {properties.map((prop, i) => {
        const isRelation = prop.type === 'relation'
        const isLast = i === properties.length - 1
        const isRowHovered = isRelation && hoveredPropertyId === prop.id
        return (
          <div
            key={prop.id}
            className={cn(
              'flex items-center gap-2 px-3 transition-colors duration-100',
              !isLast && 'prop-row-divider',
              isRelation && 'prop-row-relation',
              isRowHovered && 'prop-row-hovered'
            )}
            style={{ height: NODE_ROW_H }}
            onMouseEnter={() => isRelation && setHoveredPropertyId(prop.id)}
            onMouseLeave={() => isRelation && setHoveredPropertyId(null)}
          >
            <PropIcon type={prop.type} size={11} />
            <span className="text-[11px] text-foreground/85 truncate flex-1 font-sans">
              {prop.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
