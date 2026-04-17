import { Client, isFullDataSource } from '@notionhq/client'

export type PropertyInfo = {
  id: string
  name: string
  type: string
  /** For relation properties: the target database id */
  relationTargetId?: string
}

export type DatabaseNode = {
  id: string
  name: string
  icon: string | null
  description: string | null
  url: string
  lastEditedTime: string
  properties: PropertyInfo[]
}

export type RelationEdge = {
  id: string
  source: string
  /** Notion property id on the source database — used as sourceHandle */
  sourcePropertyId: string
  target: string
  propertyName: string
  isTwoWay: boolean
}

export async function fetchWorkspaceGraph(client: Client): Promise<{
  databases: DatabaseNode[]
  edges: RelationEdge[]
}> {
  const databases: DatabaseNode[] = []
  const edges: RelationEdge[] = []
  let cursor: string | undefined

  // Tracks sorted pair keys for dual (two-way) relations so we only emit one edge per pair
  const dualEdgeSeen = new Set<string>()

  do {
    const response = await client.search({
      filter: { property: 'object', value: 'data_source' },
      start_cursor: cursor,
      page_size: 100,
    })

    for (const result of response.results) {
      if (!isFullDataSource(result)) continue

      const name = result.title[0]?.plain_text ?? 'Untitled'
      const icon = result.icon?.type === 'emoji' ? result.icon.emoji : null

      const descriptionRichText = (result as { description?: { plain_text?: string }[] }).description
      const description =
        descriptionRichText && descriptionRichText.length > 0
          ? (descriptionRichText[0]?.plain_text ?? null)
          : null

      const rawProperties: PropertyInfo[] = Object.entries(result.properties).map(
        ([propName, prop]) => ({
          id: prop.id,
          name: propName,
          type: prop.type,
          relationTargetId:
            prop.type === 'relation' ? prop.relation.data_source_id : undefined,
        })
      )

      // Title property is always first in Notion; the API doesn't guarantee order
      const properties: PropertyInfo[] = [
        ...rawProperties.filter((p) => p.type === 'title'),
        ...rawProperties.filter((p) => p.type !== 'title'),
      ]

      databases.push({
        id: result.id,
        name,
        icon,
        description,
        url: result.url,
        lastEditedTime: result.last_edited_time,
        properties,
      })

      for (const [propName, prop] of Object.entries(result.properties)) {
        if (prop.type !== 'relation') continue

        const targetId = prop.relation.data_source_id
        const isTwoWay = prop.relation.type === 'dual_property'

        if (isTwoWay) {
          // Deduplicate: only keep one edge per undirected pair
          const pairKey = [result.id, targetId].sort().join(':')
          if (dualEdgeSeen.has(pairKey)) continue
          dualEdgeSeen.add(pairKey)
        }

        edges.push({
          id: `${result.id}__${prop.id}`,
          source: result.id,
          sourcePropertyId: prop.id,
          target: targetId,
          propertyName: propName,
          isTwoWay,
        })
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  const dbIds = new Set(databases.map((db) => db.id))
  return { databases, edges: edges.filter((e) => dbIds.has(e.target)) }
}
