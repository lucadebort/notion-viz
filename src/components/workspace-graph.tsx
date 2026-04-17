'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { computeForceLayout, nodeHeight } from '@/lib/graph/layout'
import { ThemeToggle } from '@/components/theme-toggle'
import { DatabaseNodeComponent } from '@/components/database-node'
import { DatabasePanel } from '@/components/database-panel'
import { SchemaEdge } from '@/components/schema-edge'
import { GraphHoverContext } from '@/components/graph-hover-context'
import { DisconnectButton } from '@/components/disconnect-button'
import { Tooltip } from '@/components/tooltip'
import type { DatabaseNode, RelationEdge } from '@/lib/notion/workspace'

const nodeTypes = { database: DatabaseNodeComponent }
const edgeTypes = { schema: SchemaEdge }

const defaultEdgeOptions = { type: 'schema' }

type Props = {
  databases: DatabaseNode[]
  edges: RelationEdge[]
  workspaceName: string
}

export function WorkspaceGraph({ databases, edges: relationEdges, workspaceName }: Props) {
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)

  const selectedDb = useMemo(
    () => databases.find((d) => d.id === selectedDbId) ?? null,
    [databases, selectedDbId]
  )

  const selectedEdgeInfo = useMemo(() => {
    if (!selectedEdgeId) return null
    const edge = relationEdges.find((e) => e.id === selectedEdgeId)
    if (!edge) return null
    const sourceDb = databases.find((d) => d.id === edge.source)
    const targetDb = databases.find((d) => d.id === edge.target)
    if (!sourceDb || !targetDb) return null
    return { edge, sourceDb, targetDb }
  }, [selectedEdgeId, relationEdges, databases])

  const hoveredEdgeTargets = useMemo(() => {
    if (!hoveredPropertyId) return new Set<string>()
    return new Set(
      relationEdges
        .filter((e) => e.sourcePropertyId === hoveredPropertyId)
        .map((e) => e.target)
    )
  }, [hoveredPropertyId, relationEdges])

  const positions = useMemo(
    () =>
      computeForceLayout(
        databases.map((db) => ({ id: db.id, height: nodeHeight(db.properties.length) })),
        relationEdges
      ),
    [databases, relationEdges]
  )

  const initialNodes: Node[] = useMemo(
    () =>
      databases.map((db) => ({
        id: db.id,
        type: 'database',
        position: positions[db.id] ?? { x: 0, y: 0 },
        data: { icon: db.icon, name: db.name, properties: db.properties },
      })),
    [databases, positions]
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      relationEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'schema',
        data: { propertyId: e.sourcePropertyId, isTwoWay: e.isTwoWay },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--edge-color)', width: 12, height: 12 },
        markerStart: e.isTwoWay
          ? { type: MarkerType.ArrowClosed, color: 'var(--edge-color)', width: 10, height: 10 }
          : undefined,
      })),
    [relationEdges]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedDbId((prev) => (prev === node.id ? null : node.id))
    setSelectedEdgeId(null)
  }, [])

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
    setSelectedDbId(null)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedDbId(null)
    setSelectedEdgeId(null)
  }, [])

  return (
    <GraphHoverContext.Provider
      value={{ hoveredPropertyId, hoveredEdgeTargets, setHoveredPropertyId }}
    >
      <div className="relative w-full h-full">
        {/* Right info panel */}
        <DatabasePanel
          selectedDb={selectedDb}
          selectedEdgeInfo={selectedEdgeInfo}
          databases={databases}
          edges={relationEdges}
        />

        {/* Header chip */}
        <div className="graph-chip absolute top-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-full border border-border text-xs">
          <span className="font-semibold text-foreground font-heading">{workspaceName}</span>
          <span className="text-muted-foreground">
            {databases.length} databases · {relationEdges.length} relations
          </span>
          <div className="w-px h-3 bg-border" />
          <Tooltip label="Toggle theme">
            <ThemeToggle />
          </Tooltip>
          <div className="w-px h-3 bg-border" />
          <Tooltip label="Change workspace">
            <DisconnectButton />
          </Tooltip>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.05}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--canvas-dot)" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor="var(--node-bg)" maskColor="var(--minimap-mask)" style={{ width: 120, height: 80 }} />
        </ReactFlow>
      </div>
    </GraphHoverContext.Provider>
  )
}
