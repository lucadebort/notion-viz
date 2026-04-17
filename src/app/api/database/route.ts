import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createNotionClient } from '@/lib/notion/client'
import { mapNotionDatabaseToNode } from '@/lib/notion/workspace'
import type { CreateDatabaseRequest, CreateDatabaseResponse } from './types'

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

  // Build Notion property schema — title is always included as the first property
  const notionProperties: Record<string, object> = {
    Name: { title: {} },
  }

  for (const prop of properties) {
    if (!prop.name.trim()) continue
    if (prop.type === 'title') continue // already added as "Name"
    if (prop.type === 'relation') {
      if (!prop.relationDatabaseId) continue
      notionProperties[prop.name] = { relation: { database_id: prop.relationDatabaseId } }
    } else {
      notionProperties[prop.name] = { [prop.type]: {} }
    }
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

    // databases.create returns DatabaseObjectResponse which uses `database_id` in relations,
    // unlike DataSourceObjectResponse which uses `data_source_id`. Normalize here.
    const normalizedResult = {
      ...result,
      properties: Object.fromEntries(
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
