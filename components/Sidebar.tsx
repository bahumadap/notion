'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase, Page } from '@/lib/supabase'

function PageTreeItem({ page, depth = 0 }: { page: Page; depth?: number }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(depth === 0)
  const [children, setChildren] = useState<Page[]>([])
  const [loaded, setLoaded] = useState(false)
  const isActive = pathname === `/${page.id}`
  const hasChildren = !page.is_database

  async function loadChildren() {
    if (loaded) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data }: { data: any } = await supabase
      .from('pages')
      .select('*')
      .eq('parent_id', page.id)
      .order('title')
    setChildren(data || [])
    setLoaded(true)
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    if (!expanded && !loaded) loadChildren()
    setExpanded(!expanded)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (depth === 0 && !loaded) loadChildren() }, [])

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer group transition-colors ${
          isActive
            ? 'bg-indigo-600/30 text-white'
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}

        <Link href={`/${page.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex-shrink-0 text-sm">
            {page.icon ? (
              page.icon.startsWith('http') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.icon} alt="" className="w-4 h-4 rounded" />
              ) : (
                page.icon
              )
            ) : page.is_database ? (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </span>
          <span className="text-sm truncate">{page.title}</span>
        </Link>
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <PageTreeItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const [rootPages, setRootPages] = useState<Page[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Page[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .eq('workspace_root', true)
      .order('title')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => setRootPages(data || []))
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data }: { data: any } = await supabase
        .from('pages')
        .select('*')
        .ilike('title', `%${search}%`)
        .limit(10)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col border-r border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Arch Wiki</span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-gray-300 placeholder-gray-500 text-sm pl-8 pr-3 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || searching) && (
          <div className="mt-1 bg-gray-800 rounded-md border border-gray-700 overflow-hidden">
            {searching && (
              <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>
            )}
            {searchResults.map(page => (
              <Link
                key={page.id}
                href={`/${page.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors"
                onClick={() => setSearch('')}
              >
                <span className="text-sm">
                  {page.icon || (page.is_database ? '⊞' : '📄')}
                </span>
                <span className="text-sm text-gray-300 truncate">{page.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {rootPages.map(page => (
          <PageTreeItem key={page.id} page={page} depth={0} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <Link
          href="/api/migrate?secret=check"
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Migration status
        </Link>
      </div>
    </aside>
  )
}
