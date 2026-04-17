import { NextRequest, NextResponse } from 'next/server'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('notion_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString('base64')

  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
  }

  const { access_token, workspace_id, workspace_name } = await tokenRes.json()

  const response = NextResponse.redirect(new URL('/graph', request.url))
  response.cookies.delete('notion_oauth_state')
  response.cookies.set('notion_access_token', access_token, COOKIE_OPTS)
  response.cookies.set('notion_workspace_id', workspace_id, COOKIE_OPTS)
  response.cookies.set('notion_workspace_name', workspace_name, COOKIE_OPTS)

  return response
}
