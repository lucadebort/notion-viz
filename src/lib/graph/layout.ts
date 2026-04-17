import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'

export const NODE_WIDTH = 210
export const NODE_HEADER_H = 44
export const NODE_ROW_H = 28

export function nodeHeight(propertyCount: number): number {
  return NODE_HEADER_H + propertyCount * NODE_ROW_H
}

type ForceNode = SimulationNodeDatum & { id: string; height: number }
type ForceLink = SimulationLinkDatum<ForceNode> & { isTwoWay: boolean }

export function computeForceLayout(
  nodes: { id: string; height: number }[],
  edges: { source: string; target: string; isTwoWay: boolean }[]
): Record<string, { x: number; y: number }> {
  const nodeIds = nodes.map((n) => n.id)
  const heightMap = Object.fromEntries(nodes.map((n) => [n.id, n.height]))

  // Seed positions on a circle for deterministic convergence
  const simNodes: ForceNode[] = nodes.map(({ id, height }, i) => {
    const angle = (2 * Math.PI * i) / nodes.length
    const r = Math.max(200, nodes.length * 22)
    return { id, height, x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })

  const links: ForceLink[] = edges
    .filter((e) => nodeIds.includes(e.source) && nodeIds.includes(e.target))
    .map((e) => ({ source: e.source, target: e.target, isTwoWay: e.isTwoWay }))

  forceSimulation(simNodes)
    .force(
      'link',
      forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .distance((d) => {
          const src = d.source as ForceNode
          const tgt = d.target as ForceNode
          // Base link distance on the taller of the two nodes
          const tallest = Math.max(src.height ?? 200, tgt.height ?? 200)
          return tallest * 0.9 + 120
        })
        .strength((d) => (d.isTwoWay ? 1.0 : 0.7))
    )
    .force('charge', forceManyBody().strength(-600))
    .force('center', forceCenter(0, 0))
    .force(
      'collide',
      forceCollide<ForceNode>().radius((d) => {
        const h = heightMap[d.id] ?? 200
        return Math.max(h / 2, NODE_WIDTH / 2) + 40
      })
    )
    .stop()
    .tick(300)

  return Object.fromEntries(simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))
}
