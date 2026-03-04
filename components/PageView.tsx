import Link from 'next/link'
import type { Page } from '@/lib/supabase'
import type { ChildDatabase } from '@/app/[pageId]/page'
import BlockRenderer from './BlockRenderer'
import InlineDatabaseTable from './InlineDatabaseTable'

type Props = {
  page: Page
  childDatabases?: ChildDatabase[]
  childPages?: Page[]
}

export default function PageView({ page, childDatabases = [], childPages = [] }: Props) {
  // Build a map of notion_id -> ChildDatabase for inline rendering
  const dbByNotionId = new Map<string, ChildDatabase>()
  const dbByTitle = new Map<string, ChildDatabase>()
  for (const cd of childDatabases) {
    if (cd.page.notion_id) dbByNotionId.set(cd.page.notion_id, cd)
    dbByTitle.set(cd.page.title.toLowerCase(), cd)
  }

  // Find child_database blocks in content and resolve them
  const childDbBlocks = (page.content || []).filter(b =>
    b.type === 'child_database' || b.type === 'linked_to_database'
  )

  // Databases to render inline (matched from content blocks)
  const inlineDbIds = new Set<string>()
  const resolvedInline: Array<{ blockId: string; db: ChildDatabase }> = []

  for (const block of childDbBlocks) {
    // Try to match by notion_id (block.id is the database's notion id)
    const matched = dbByNotionId.get(block.id) || dbByTitle.get((block.content || '').toLowerCase())
    if (matched) {
      resolvedInline.push({ blockId: block.id, db: matched })
      inlineDbIds.add(matched.page.id)
    }
  }

  // Databases NOT matched to inline blocks (append at end)
  const appendedDbs = childDatabases.filter(cd => !inlineDbIds.has(cd.page.id))

  return (
    <div className="min-h-screen">
      {/* Cover image */}
      {page.cover && (
        <div className="h-48 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Icon + Title */}
        <div className="mb-8">
          {page.icon && (
            <div className="mb-3">
              {page.icon.startsWith('http') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.icon} alt="" className="w-12 h-12 rounded" />
              ) : (
                <span className="text-5xl">{page.icon}</span>
              )}
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">{page.title}</h1>
        </div>

        {/* Content blocks */}
        {page.content && page.content.length > 0 && (
          <BlockRenderer blocks={page.content} childDatabases={childDatabases} />
        )}

        {/* Inline databases not matched to blocks but are children */}
        {appendedDbs.map(cd => (
          <div key={cd.page.id} className="mt-8">
            <InlineDatabaseTable childDb={cd} />
          </div>
        ))}

        {/* Child pages list */}
        {childPages.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Sub-pages
            </h3>
            <div className="grid gap-1">
              {childPages.map(p => (
                <Link
                  key={p.id}
                  href={`/${p.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-lg flex-shrink-0">
                    {p.icon && !p.icon.startsWith('http') ? p.icon : '📄'}
                  </span>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!page.content?.length && !childDatabases.length && !childPages.length && (
          <p className="text-gray-400 italic">This page has no content.</p>
        )}
      </div>
    </div>
  )
}
