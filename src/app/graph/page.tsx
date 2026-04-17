import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createNotionClient } from '@/lib/notion/client'
import { fetchWorkspaceGraph } from '@/lib/notion/workspace'
import { WorkspaceGraphClient } from '@/components/workspace-graph-client'

export default async function GraphPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('notion_access_token')?.value
  const workspaceName = cookieStore.get('notion_workspace_name')?.value

  if (!accessToken) redirect('/')

  const notion = createNotionClient(accessToken)
  const { databases, edges } = await fetchWorkspaceGraph(notion)

  return (
    <main className="w-screen h-screen bg-background">
      <WorkspaceGraphClient
        databases={databases}
        edges={edges}
        workspaceName={workspaceName ?? 'Workspace'}
      />
    </main>
  )
}
