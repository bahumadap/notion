import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import type { Page, DbRecord } from '@/lib/supabase'
import PageView from '@/components/PageView'
import DatabaseView from '@/components/DatabaseView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ pageId: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { title: 'Arch Wiki' }
  const { pageId } = await params
  const db = createServerClient()
  const { data } = await db.from('pages').select('title, icon').eq('id', pageId).single()
  if (!data) return { title: 'Not Found — Arch Wiki' }
  return {
    title: `${data.icon ? data.icon + ' ' : ''}${data.title} — Arch Wiki`,
  }
}

export type ChildDatabase = {
  page: Page
  records: DbRecord[]
}

export default async function PageRoute({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  const db = createServerClient()

  const { data: page } = await db
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (!page) notFound()

  if (page.is_database) {
    const { data: records } = await db
      .from('db_records')
      .select('*')
      .eq('database_id', pageId)
      .order('title')
    return <DatabaseView page={page} records={records || []} />
  }

  // Fetch child pages and databases
  const { data: children } = await db
    .from('pages')
    .select('*')
    .eq('parent_id', pageId)
    .order('title')

  const childPages = (children || []).filter((c: Page) => !c.is_database)
  const childDbs = (children || []).filter((c: Page) => c.is_database)

  // Fetch records for each child database
  const childDatabases: ChildDatabase[] = await Promise.all(
    childDbs.map(async (dbPage: Page) => {
      const { data: records } = await db
        .from('db_records')
        .select('*')
        .eq('database_id', dbPage.id)
        .order('title')
      return { page: dbPage, records: records || [] }
    })
  )

  return (
    <PageView
      page={page}
      childDatabases={childDatabases}
      childPages={childPages}
    />
  )
}
