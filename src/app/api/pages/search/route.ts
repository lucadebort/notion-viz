import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createNotionClient } from '@/lib/notion/client'
import { isFullPage } from '@notionhq/client'

export type PageResult = {
  id: string
  title: string
  icon: string | null
}

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('notion_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''

  const notion = createNotionClient(accessToken)

  try {
    const response = await notion.search({
      query,
      filter: { property: 'object', value: 'page' },
      page_size: 10,
    })

    const pages: PageResult[] = response.results
      .filter((result) => {
        if (!isFullPage(result)) return false
        // Exclude database rows (pages whose parent is a database)
        return result.parent.type !== 'database_id'
      })
      .map((result) => {
        if (!isFullPage(result)) return null
        const titleProp = Object.values(result.properties).find((p) => p.type === 'title')
        const title =
          titleProp?.type === 'title'
            ? (titleProp.title[0]?.plain_text ?? 'Untitled')
            : 'Untitled'
        const icon = result.icon?.type === 'emoji' ? result.icon.emoji : null
        return { id: result.id, title, icon }
      })
      .filter((p): p is PageResult => p !== null)

    return NextResponse.json({ pages })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search pages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
