import Link from 'next/link'
import type { ChildDatabase } from '@/app/[pageId]/page'
import type { DatabaseColumn, DbRecord } from '@/lib/supabase'

function CellValue({ value, col }: { value: unknown; col: DatabaseColumn }) {
  if (value === null || value === undefined || value === '') return <span className="text-gray-300">—</span>

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800', yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800', purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800', gray: 'bg-gray-100 text-gray-700',
    brown: 'bg-amber-100 text-amber-800', default: 'bg-gray-100 text-gray-700',
  }

  switch (col.type) {
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} readOnly className="rounded border-gray-300 text-indigo-600" />
    case 'select':
    case 'status': {
      const opt = col.options?.find(o => o.name === value)
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[opt?.color || 'default']}`}>
          {String(value)}
        </span>
      )
    }
    case 'multi_select': {
      const vals = Array.isArray(value) ? value : [value]
      return (
        <div className="flex flex-wrap gap-1">
          {vals.map((v, i) => {
            const opt = col.options?.find(o => o.name === v)
            return <span key={i} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[opt?.color || 'default']}`}>{String(v)}</span>
          })}
        </div>
      )
    }
    case 'number':
      return <span className="text-sm font-mono">{String(value)}</span>
    case 'date':
      return <span className="text-sm">{new Date(String(value)).toLocaleDateString()}</span>
    case 'url':
      return <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm truncate max-w-[150px] block">{String(value)}</a>
    case 'people':
      if (Array.isArray(value)) return <span className="text-sm">{(value as string[]).join(', ')}</span>
      return <span className="text-sm">{String(value)}</span>
    default:
      return <span className="text-sm">{String(value)}</span>
  }
}

export default function InlineDatabaseTable({ childDb }: { childDb: ChildDatabase }) {
  const { page, records } = childDb
  const columns = (page.db_schema?.columns || []).filter(
    c => c.type !== 'formula' && c.type !== 'rollup'
  )

  // Smart column selection: show title + up to 4 most useful columns
  const titleCol = columns.find(c => c.type === 'title')
  const otherCols = columns.filter(c => c.type !== 'title').slice(0, 4)
  const displayCols = titleCol ? [titleCol, ...otherCols] : columns.slice(0, 5)

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-base">
            {page.icon && !page.icon.startsWith('http') ? page.icon : '⊞'}
          </span>
          <span className="font-semibold text-sm text-gray-800">{page.title}</span>
          <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5">{records.length}</span>
        </div>
        <Link
          href={`/${page.id}`}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
        >
          Open full view →
        </Link>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-400">No records</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {displayCols.map(col => (
                  <th key={col.id} className="px-4 py-2 text-left text-xs font-medium text-gray-400 whitespace-nowrap">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record: DbRecord) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {displayCols.map(col => {
                    const val = col.type === 'title' ? record.title : record.properties?.[col.name]
                    return (
                      <td key={col.id} className="px-4 py-2 max-w-[250px]">
                        <CellValue value={val} col={col} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
