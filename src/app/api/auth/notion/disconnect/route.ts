import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete('notion_access_token')
  cookieStore.delete('notion_workspace_id')
  cookieStore.delete('notion_workspace_name')
  redirect('/')
}
