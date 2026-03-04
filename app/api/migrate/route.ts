import { NextRequest, NextResponse } from 'next/server'
import { runMigration } from '@/lib/notion-migrate'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-migration-secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.NOTION_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'NOTION_TOKEN not configured' }, { status: 500 })
  }

  try {
    const result = await runMigration(token)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'Migration endpoint ready. POST to this URL with x-migration-secret header.',
    usage: 'POST /api/migrate with header x-migration-secret: <your-secret>',
  })
}
