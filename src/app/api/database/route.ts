import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createNotionClient } from '@/lib/notion/client'
import { mapNotionDatabaseToNode } from '@/lib/notion/workspace'
import type { CreateDatabaseRequest, CreateDatabaseResponse, CreatePropertyRequest } from './types'

function buildPropertySchema(prop: CreatePropertyRequest): object {
  switch (prop.type) {
    case 'number':
      return { number: { format: prop.numberFormat ?? 'number' } }
    case 'select':
      return { select: { options: (prop.selectOptions ?? []).map((o) => ({ name: o.name, color: o.color })) } }
    case 'multi_select':
      return { multi_select: { options: (prop.selectOptions ?? []).map((o) => ({ name: o.name, color: o.color })) } }
    case 'relation':
      if (!prop.relationDatabaseId) return {}
      return prop.isTwoWay
        ? { relation: { database_id: prop.relationDatabaseId, dual_property: {} } }
        : { relation: { database_id: prop.relationDatabaseId } }
    case 'formula':
      return { formula: { expression: prop.formulaExpression ?? '' } }
    case 'unique_id':
      return prop.uniqueIdPrefix
        ? { unique_id: { prefix: prop.uniqueIdPrefix } }
        : { unique_id: {} }
    // Simple types — no additional config
    default:
      return { [prop.type]: {} }
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('notion_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateDatabaseRequest = await req.json()
  const { parentPageId, title, icon, properties } = body

  if (!parentPageId || !title) {
    return NextResponse.json({ error: 'parentPageId and title are required' }, { status: 400 })
  }

  // Title property is always first and mandatory
  const notionProperties: Record<string, object> = { Name: { title: {} } }

  for (const prop of properties) {
    if (!prop.name.trim() || prop.type === 'title') continue
    const schema = buildPropertySchema(prop)
    if (Object.keys(schema).length === 0) continue
    notionProperties[prop.name] = schema
  }

  const notion = createNotionClient(accessToken)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion.databases.create as any)({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: title } }],
      ...(icon ? { icon: { type: 'emoji', emoji: icon } } : {}),
      properties: notionProperties,
    })

    // Normalize: databases.create returns database_id in relations;
    // our workspace types use data_source_id (from the search API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedResult = {
      ...result,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(result.properties ?? {}).map(([k, v]: [string, any]) => [
          k,
          v?.type === 'relation' && v.relation?.database_id
            ? { ...v, relation: { ...v.relation, data_source_id: v.relation.database_id } }
            : v,
        ])
      ),
    }

    const database = mapNotionDatabaseToNode(normalizedResult)
    return NextResponse.json({ database } satisfies CreateDatabaseResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create database'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
