'use client'

import { useState } from 'react'
import type { Page, DbRecord } from '@/lib/supabase'
import DatabaseTable from './DatabaseTable'
import KanbanBoard from './KanbanBoard'

type ViewMode = 'table' | 'kanban'

export default function DatabaseView({ page, records }: { page: Page; records: DbRecord[] }) {
  const [view, setView] = useState<ViewMode>('table')

  const hasStatusColumn = page.db_schema?.columns.some(
    col => col.type === 'status' || (col.type === 'select' && col.name.toLowerCase() === 'status')
  )

  return (
    <div className="min-h-screen">
      {/* Cover */}
      {page.cover && (
        <div className="h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          {page.icon && (
            <div className="mb-2">
              {page.icon.startsWith('http') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.icon} alt="" className="w-10 h-10 rounded" />
              ) : (
                <span className="text-4xl">{page.icon}</span>
              )}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{records.length} records</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-5 border border-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Table
          </button>
          {hasStatusColumn && (
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban
            </button>
          )}
        </div>

        {/* View content */}
        {view === 'table' ? (
          <DatabaseTable page={page} records={records} />
        ) : (
          <KanbanBoard page={page} records={records} />
        )}
      </div>
    </div>
  )
}
