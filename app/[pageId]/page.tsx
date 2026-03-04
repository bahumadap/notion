import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
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

export default async function PageRoute({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  const db = createServerClient()

  const { data: page } = await db
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (!page) {
    notFound()
  }

  if (page.is_database) {
    const { data: records } = await db
      .from('db_records')
      .select('*')
      .eq('database_id', pageId)
      .order('title')

    return <DatabaseView page={page} records={records || []} />
  }

  return <PageView page={page} />
}
