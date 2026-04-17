import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createNotionClient } from '@/lib/notion/client'

export type SampleEntry = {
  id: string
  title: string
  lastEditedTime: string
  url: string
}

export type DatabaseEntriesResponse = {
  entries: SampleEntry[]
  totalCount: number
  hasMore: boolean
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('notion_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notion = createNotionClient(accessToken)

  try {
    // Fetch 5 most recently edited entries
    const response = await notion.dataSources.query({
      data_source_id: id,
      page_size: 5,
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    })

    const entries: SampleEntry[] = response.results.map((page) => {
      // Extract title from the title property
      let title = 'Untitled'
      const pageAny = page as {
        properties?: Record<string, { type: string; title?: { plain_text: string }[] }>
        last_edited_time?: string
        url?: string
      }
      if (pageAny.properties) {
        for (const prop of Object.values(pageAny.properties)) {
          if (prop.type === 'title' && prop.title && prop.title.length > 0) {
            title = prop.title[0]?.plain_text ?? 'Untitled'
            break
          }
        }
      }

      return {
        id: page.id,
        title,
        lastEditedTime: pageAny.last_edited_time ?? '',
        url: pageAny.url ?? `https://notion.so/${page.id.replace(/-/g, '')}`,
      }
    })

    // Get total count with a minimal query
    let totalCount = entries.length
    if (response.has_more) {
      // Notion doesn't expose total count directly; we use a cursor-based count
      // For display we'll show "and X more" as hasMore is true
      // We can do a follow-up query to get a rough total if needed
      // For now, the hasMore flag is sufficient for the "and X more" display
      totalCount = entries.length
    }

    return NextResponse.json({
      entries,
      totalCount,
      hasMore: response.has_more,
    } satisfies DatabaseEntriesResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch entries'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
