'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus } from 'lucide-react'
import { computeForceLayout, nodeHeight, NODE_WIDTH } from '@/lib/graph/layout'
import { ThemeToggle } from '@/components/theme-toggle'
import { DatabaseNodeComponent } from '@/components/database-node'
import { DatabasePanel } from '@/components/database-panel'
import { SchemaEdge } from '@/components/schema-edge'
import { GraphHoverContext } from '@/components/graph-hover-context'
import { DisconnectButton } from '@/components/disconnect-button'
import { Tooltip } from '@/components/tooltip'
import { CreateDatabasePanel } from '@/components/create-db/create-database-panel'
import type { DatabaseNode, RelationEdge } from '@/lib/notion/workspace'

const nodeTypes = { database: DatabaseNodeComponent }
const edgeTypes = { schema: SchemaEdge }
const defaultEdgeOptions = { type: 'schema' }

type Props = {
  databases: DatabaseNode[]
  edges: RelationEdge[]
  workspaceName: string
}

function makeFlowEdge(e: RelationEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'schema',
    data: { propertyId: e.sourcePropertyId, isTwoWay: e.isTwoWay },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--edge-color)', width: 12, height: 12 },
    markerStart: e.isTwoWay
      ? { type: MarkerType.ArrowClosed, color: 'var(--edge-color)', width: 10, height: 10 }
      : undefined,
  }
}

function GraphInner({ databases: initialDatabases, edges: initialRelationEdges, workspaceName }: Props) {
  const { getViewport } = useReactFlow()

  const [panelMode, setPanelMode] = useState<'inspect' | 'create'>('inspect')
  const [localDatabases, setLocalDatabases] = useState<DatabaseNode[]>(initialDatabases)
  const [localRelationEdges, setLocalRelationEdges] = useState<RelationEdge[]>(initialRelationEdges)

  const [selectedDbId, setSelectedDbId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)

  const selectedDb = useMemo(
    () => localDatabases.find((d) => d.id === selectedDbId) ?? null,
    [localDatabases, selectedDbId]
  )

  const selectedEdgeInfo = useMemo(() => {
    if (!selectedEdgeId) return null
    const edge = localRelationEdges.find((e) => e.id === selectedEdgeId)
    if (!edge) return null
    const sourceDb = localDatabases.find((d) => d.id === edge.source)
    const targetDb = localDatabases.find((d) => d.id === edge.target)
    if (!sourceDb || !targetDb) return null
    return { edge, sourceDb, targetDb }
  }, [selectedEdgeId, localRelationEdges, localDatabases])

  const hoveredEdgeTargets = useMemo(() => {
    if (!hoveredPropertyId) return new Set<string>()
    return new Set(
      localRelationEdges
        .filter((e) => e.sourcePropertyId === hoveredPropertyId)
        .map((e) => e.target)
    )
  }, [hoveredPropertyId, localRelationEdges])

  const positions = useMemo(
    () =>
      computeForceLayout(
        initialDatabases.map((db) => ({ id: db.id, height: nodeHeight(db.properties.length) })),
        initialRelationEdges
      ),
    // Only run force layout on initial data — new nodes get viewport-centered position
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const initialNodes: Node[] = useMemo(
    () =>
      initialDatabases.map((db) => ({
        id: db.id,
        type: 'database',
        position: positions[db.id] ?? { x: 0, y: 0 },
        data: { icon: db.icon, name: db.name, properties: db.properties },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const initialEdges: Edge[] = useMemo(
    () => initialRelationEdges.map(makeFlowEdge),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedDbId((prev) => (prev === node.id ? null : node.id))
    setSelectedEdgeId(null)
    setPanelMode('inspect')
  }, [])

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id))
    setSelectedDbId(null)
    setPanelMode('inspect')
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedDbId(null)
    setSelectedEdgeId(null)
  }, [])

  const handleDatabaseCreated = useCallback((db: DatabaseNode) => {
    // Compute viewport-centered position for the new node
    const { x, y, zoom } = getViewport()
    const cx = (-x + window.innerWidth / 2) / zoom - NODE_WIDTH / 2
    const cy = (-y + window.innerHeight / 2) / zoom - nodeHeight(db.properties.length) / 2

    const newNode: Node = {
      id: db.id,
      type: 'database',
      position: { x: cx, y: cy },
      data: { icon: db.icon, name: db.name, properties: db.properties },
    }

    // Derive any relation edges from the new database's properties
    const newEdges: RelationEdge[] = db.properties
      .filter((p) => p.type === 'relation' && p.relationTargetId)
      .map((p) => ({
        id: `${db.id}__${p.id}`,
        source: db.id,
        sourcePropertyId: p.id,
        target: p.relationTargetId!,
        propertyName: p.name,
        isTwoWay: false,
      }))

    setLocalDatabases((prev) => [...prev, db])
    setLocalRelationEdges((prev) => [...prev, ...newEdges])
    setNodes((prev) => [...prev, newNode])
    setEdges((prev) => [...prev, ...newEdges.map(makeFlowEdge)])
    setSelectedDbId(db.id)
    setPanelMode('inspect')
  }, [getViewport, setNodes, setEdges])

  return (
    <GraphHoverContext.Provider
      value={{ hoveredPropertyId, hoveredEdgeTargets, setHoveredPropertyId }}
    >
      <div className="relative w-full h-full">
        {/* Right panel — inspect or create */}
        {panelMode === 'create' ? (
          <CreateDatabasePanel
            databases={localDatabases}
            onCreated={handleDatabaseCreated}
            onClose={() => setPanelMode('inspect')}
          />
        ) : (
          <DatabasePanel
            selectedDb={selectedDb}
            selectedEdgeInfo={selectedEdgeInfo}
            databases={localDatabases}
            edges={localRelationEdges}
          />
        )}

        {/* Header chip */}
        <div className="graph-chip absolute top-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-full border border-border text-xs">
          <span className="font-semibold text-foreground font-heading">{workspaceName}</span>
          <span className="text-muted-foreground">
            {localDatabases.length} databases · {localRelationEdges.length} relations
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
          <MiniMap position="bottom-left" style={{ width: 120, height: 80, marginLeft: 48 }} />
        </ReactFlow>

        {/* New database FAB — after ReactFlow so it renders above it, left of the side panel */}
        <Tooltip label="New database">
          <button
            type="button"
            onClick={() => setPanelMode((m) => (m === 'create' ? 'inspect' : 'create'))}
            className="graph-chip absolute bottom-4 z-30 flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
            style={{ right: 'calc(18rem + 20px)' }}
            aria-label="New database"
          >
            <Plus size={15} />
          </button>
        </Tooltip>
      </div>
    </GraphHoverContext.Provider>
  )
}

export function WorkspaceGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  )
}
