'use client'

import { useState, useMemo } from 'react'
import type { Page, DbRecord, DatabaseColumn } from '@/lib/supabase'

function CellValue({ value, column }: { value: unknown; column: DatabaseColumn }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300">—</span>
  }

  switch (column.type) {
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          readOnly
          className="rounded border-gray-300 text-indigo-600"
        />
      )

    case 'select':
    case 'status': {
      const option = column.options?.find(o => o.name === value)
      const color = option?.color || 'gray'
      const colorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        orange: 'bg-orange-100 text-orange-800',
        purple: 'bg-purple-100 text-purple-800',
        pink: 'bg-pink-100 text-pink-800',
        gray: 'bg-gray-100 text-gray-700',
        brown: 'bg-amber-100 text-amber-800',
        default: 'bg-gray-100 text-gray-700',
      }
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.default}`}>
          {String(value)}
        </span>
      )
    }

    case 'multi_select': {
      const values = Array.isArray(value) ? value : [value]
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v, i) => {
            const option = column.options?.find(o => o.name === v)
            const color = option?.color || 'gray'
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-100 text-blue-800',
              green: 'bg-green-100 text-green-800',
              red: 'bg-red-100 text-red-800',
              yellow: 'bg-yellow-100 text-yellow-800',
              orange: 'bg-orange-100 text-orange-800',
              purple: 'bg-purple-100 text-purple-800',
              pink: 'bg-pink-100 text-pink-800',
              gray: 'bg-gray-100 text-gray-700',
              default: 'bg-gray-100 text-gray-700',
            }
            return (
              <span key={i} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.default}`}>
                {String(v)}
              </span>
            )
          })}
        </div>
      )
    }

    case 'date':
      if (!value) return <span className="text-gray-300">—</span>
      return <span className="text-sm">{new Date(String(value)).toLocaleDateString()}</span>

    case 'url':
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm truncate max-w-[200px] block">
          {String(value)}
        </a>
      )

    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-indigo-600 hover:underline text-sm">
          {String(value)}
        </a>
      )

    case 'number':
      return <span className="text-sm font-mono">{String(value)}</span>

    case 'people':
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((v, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {String(v)}
              </span>
            ))}
          </div>
        )
      }
      return <span className="text-sm">{String(value)}</span>

    default:
      return <span className="text-sm truncate max-w-[250px] block">{String(value)}</span>
  }
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null

export default function DatabaseTable({ page, records }: { page: Page; records: DbRecord[] }) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<SortConfig>(null)

  const displayColumns = useMemo(() =>
    (page.db_schema?.columns || []).filter(col => col.type !== 'formula' && col.type !== 'rollup'),
    [page.db_schema]
  )

  const filteredRecords = useMemo(() => {
    let result = records

    if (filter.trim()) {
      const q = filter.toLowerCase()
      result = result.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        Object.values(r.properties || {}).some(v =>
          v !== null && String(v).toLowerCase().includes(q)
        )
      )
    }

    if (sort) {
      result = [...result].sort((a, b) => {
        const aVal = sort.key === 'title' ? (a.title || '') : (a.properties?.[sort.key] ?? '')
        const bVal = sort.key === 'title' ? (b.title || '') : (b.properties?.[sort.key] ?? '')
        const cmp = String(aVal).localeCompare(String(bVal))
        return sort.direction === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [records, filter, sort])

  function handleSort(colName: string) {
    setSort(prev => {
      if (prev?.key === colName) {
        return prev.direction === 'asc' ? { key: colName, direction: 'desc' } : null
      }
      return { key: colName, direction: 'asc' }
    })
  }

  function SortIcon({ colName }: { colName: string }) {
    if (sort?.key !== colName) return <span className="text-gray-300">↕</span>
    return <span className="text-indigo-500">{sort.direction === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400"
          />
        </div>
        <span className="text-sm text-gray-400">{filteredRecords.length} records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayColumns.map(col => (
                <th
                  key={col.id}
                  onClick={() => handleSort(col.name)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col.name}
                    <SortIcon colName={col.name} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={displayColumns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  {displayColumns.map(col => {
                    const value = col.type === 'title'
                      ? record.title
                      : record.properties?.[col.name]
                    return (
                      <td key={col.id} className="px-4 py-3 max-w-[300px]">
                        <CellValue value={value} column={col} />
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
