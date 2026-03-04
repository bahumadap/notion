import type { Page } from '@/lib/supabase'
import BlockRenderer from './BlockRenderer'

export default function PageView({ page }: { page: Page }) {
  return (
    <div className="min-h-screen">
      {/* Cover image */}
      {page.cover && (
        <div className="h-48 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.cover}
            alt=""
            className="w-full h-full object-cover"
          />
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
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {page.title}
          </h1>
        </div>

        {/* Content blocks */}
        {page.content && page.content.length > 0 ? (
          <BlockRenderer blocks={page.content} />
        ) : (
          <p className="text-gray-400 italic">This page has no content.</p>
        )}
      </div>
    </div>
  )
}
