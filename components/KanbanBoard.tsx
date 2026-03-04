'use client'

import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import type { Page, DbRecord, DatabaseColumn, SelectOption } from '@/lib/supabase'

function RecordCard({ record, index }: { record: DbRecord; index: number }) {
  const visibleProps = Object.entries(record.properties || {})
    .filter(([key, val]) => key !== 'Status' && val !== null && val !== '' && !Array.isArray(val))
    .slice(0, 3)

  return (
    <Draggable draggableId={record.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-300' : 'hover:shadow-md'
          }`}
        >
          <p className="font-medium text-sm text-gray-900 mb-2 leading-snug">
            {record.title || 'Untitled'}
          </p>
          {visibleProps.map(([key, val]) => (
            <div key={key} className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400 flex-shrink-0">{key}:</span>
              <span className="text-xs text-gray-600 truncate">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </Draggable>
  )
}

type Column = {
  id: string
  name: string
  color: string
  records: DbRecord[]
}

const COLOR_MAP: Record<string, string> = {
  blue: 'border-t-blue-400',
  green: 'border-t-green-400',
  red: 'border-t-red-400',
  yellow: 'border-t-yellow-400',
  orange: 'border-t-orange-400',
  purple: 'border-t-purple-400',
  pink: 'border-t-pink-400',
  gray: 'border-t-gray-300',
  brown: 'border-t-amber-400',
  default: 'border-t-gray-300',
}

export default function KanbanBoard({ page, records: initialRecords }: { page: Page; records: DbRecord[] }) {
  const [records, setRecords] = useState(initialRecords)

  const statusColumn = useMemo((): DatabaseColumn | undefined => {
    return page.db_schema?.columns.find(
      col => col.type === 'status' || (col.type === 'select' && col.name.toLowerCase() === 'status')
    )
  }, [page.db_schema])

  const columns = useMemo((): Column[] => {
    if (!statusColumn) {
      return [{ id: 'all', name: 'All Records', color: 'gray', records }]
    }

    const options: SelectOption[] = statusColumn.options || []
    const noStatusRecords = records.filter(r => !r.properties?.[statusColumn.name])

    const cols: Column[] = options.map(opt => ({
      id: opt.id,
      name: opt.name,
      color: opt.color,
      records: records.filter(r => r.properties?.[statusColumn.name] === opt.name),
    }))

    if (noStatusRecords.length > 0) {
      cols.unshift({
        id: 'no-status',
        name: 'No Status',
        color: 'gray',
        records: noStatusRecords,
      })
    }

    return cols
  }, [records, statusColumn])

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination || !statusColumn) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const destColumn = columns.find(c => c.id === destination.droppableId)
    if (!destColumn) return

    setRecords(prev =>
      prev.map(r => {
        if (r.id !== draggableId) return r
        return {
          ...r,
          properties: {
            ...r.properties,
            [statusColumn.name]: destColumn.name === 'No Status' ? null : destColumn.name,
          },
        }
      })
    )
  }

  if (!statusColumn) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No Status field found. Kanban view requires a Status or select field named &quot;Status&quot;.</p>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72">
            <div className={`bg-gray-50 rounded-lg border border-gray-200 border-t-4 ${COLOR_MAP[col.color] || COLOR_MAP.default}`}>
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center justify-between">
                <h3 className="font-medium text-sm text-gray-700">{col.name}</h3>
                <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5">
                  {col.records.length}
                </span>
              </div>

              {/* Cards */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`px-2 pb-2 min-h-[120px] space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                    }`}
                  >
                    {col.records.map((record, i) => (
                      <RecordCard key={record.id} record={record} index={i} />
                    ))}
                    {provided.placeholder}
                    {col.records.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
