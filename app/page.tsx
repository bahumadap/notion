import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let data = null
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const db = createServerClient()
    const result = await db
      .from('pages')
      .select('id')
      .eq('workspace_root', true)
      .order('title')
      .limit(1)
      .single()
    data = result.data
  }

  if (data?.id) {
    redirect(`/${data.id}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-lg px-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Arch Wiki</h1>
        <p className="text-gray-500 mb-6">No pages found. Run the migration to import content from Notion.</p>
        <div className="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono border border-gray-200">
          <p className="text-gray-400 mb-1"># Run migration:</p>
          <p className="text-gray-700">curl -X POST https://your-app.vercel.app/api/migrate \</p>
          <p className="text-gray-700 pl-4">-H &apos;x-migration-secret: YOUR_SECRET&apos;</p>
        </div>
      </div>
    </div>
  )
}
