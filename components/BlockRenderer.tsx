import type { NotionBlock } from '@/lib/supabase'
import type { ChildDatabase } from '@/app/[pageId]/page'
import InlineDatabaseTable from './InlineDatabaseTable'

const CALLOUT_COLORS: Record<string, string> = {
  blue_background: 'bg-blue-50 border-blue-200',
  yellow_background: 'bg-yellow-50 border-yellow-200',
  red_background: 'bg-red-50 border-red-200',
  green_background: 'bg-green-50 border-green-200',
  purple_background: 'bg-purple-50 border-purple-200',
  gray_background: 'bg-gray-50 border-gray-200',
  default: 'bg-gray-50 border-gray-200',
}

function Block({ block, childDatabases = [] }: { block: NotionBlock; childDatabases?: ChildDatabase[] }) {
  // Build lookup maps for inline database resolution
  const dbByNotionId = new Map(childDatabases.map(cd => [cd.page.notion_id, cd]))
  const dbByTitle = new Map(childDatabases.map(cd => [cd.page.title.toLowerCase(), cd]))
  switch (block.type) {
    case 'paragraph':
      if (!block.content) return <p className="min-h-[1.5em]" />
      return <p>{block.content}</p>

    case 'heading_1':
      return <h1 className="text-3xl font-bold mt-6 mb-2">{block.content}</h1>

    case 'heading_2':
      return <h2 className="text-2xl font-semibold mt-5 mb-2">{block.content}</h2>

    case 'heading_3':
      return <h3 className="text-xl font-semibold mt-4 mb-1">{block.content}</h3>

    case 'bulleted_list_item':
      return (
        <li className="ml-4 list-disc">
          {block.content}
          {block.children && block.children.length > 0 && (
            <ul className="mt-1">
              {block.children.map(child => (
                <Block key={child.id} block={child} />
              ))}
            </ul>
          )}
        </li>
      )

    case 'numbered_list_item':
      return (
        <li className="ml-4 list-decimal">
          {block.content}
          {block.children && block.children.length > 0 && (
            <ol className="mt-1">
              {block.children.map(child => (
                <Block key={child.id} block={child} />
              ))}
            </ol>
          )}
        </li>
      )

    case 'to_do':
      return (
        <div className="flex items-start gap-2 my-0.5">
          <input
            type="checkbox"
            checked={block.checked}
            readOnly
            className="mt-0.5 rounded border-gray-300 text-indigo-600"
          />
          <span className={block.checked ? 'line-through text-gray-400' : ''}>{block.content}</span>
        </div>
      )

    case 'toggle':
      return (
        <details className="my-1 group">
          <summary className="cursor-pointer list-none flex items-center gap-1 font-medium hover:text-gray-700">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {block.content}
          </summary>
          {block.children && (
            <div className="pl-5 mt-1">
              {block.children.map(child => <Block key={child.id} block={child} />)}
            </div>
          )}
        </details>
      )

    case 'code':
      return (
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm font-mono my-3">
          <code className={block.language ? `language-${block.language}` : ''}>
            {block.content}
          </code>
        </pre>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 py-1 text-gray-600 italic my-2">
          {block.content}
        </blockquote>
      )

    case 'callout': {
      const colorClass = CALLOUT_COLORS[block.color || 'default'] || CALLOUT_COLORS.default
      return (
        <div className={`flex gap-3 p-4 rounded-lg border my-3 ${colorClass}`}>
          {block.icon && <span className="text-xl flex-shrink-0">{block.icon}</span>}
          <p className="text-sm">{block.content}</p>
        </div>
      )
    }

    case 'divider':
      return <hr className="my-4 border-gray-200" />

    case 'image':
      if (!block.url) return null
      return (
        <figure className="my-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.caption || ''}
            className="rounded-lg max-w-full"
            loading="lazy"
          />
          {block.caption && (
            <figcaption className="text-sm text-gray-500 text-center mt-1">{block.caption}</figcaption>
          )}
        </figure>
      )

    case 'video':
      if (!block.url) return null
      return (
        <div className="my-4">
          <video
            src={block.url}
            controls
            className="rounded-lg max-w-full"
          />
          {block.caption && (
            <p className="text-sm text-gray-500 text-center mt-1">{block.caption}</p>
          )}
        </div>
      )

    case 'embed':
    case 'bookmark':
      if (!block.url) return null
      return (
        <div className="my-3">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="text-sm text-indigo-600 group-hover:underline truncate">
              {block.caption || block.url}
            </span>
          </a>
        </div>
      )

    case 'table_of_contents':
      return <div className="my-2 text-sm text-gray-400 italic">[Table of contents]</div>

    case 'child_page':
      return null // Shown in PageView's sub-pages section

    case 'child_database':
    case 'linked_to_database': {
      // Try to find the matching child database by notion_id or title
      const matched = dbByNotionId.get(block.id) || dbByTitle.get((block.content || '').toLowerCase())
      if (matched) {
        return (
          <div className="my-4">
            <InlineDatabaseTable childDb={matched} />
          </div>
        )
      }
      // Fallback: show as a placeholder
      return (
        <div className="my-3 flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
          <span>⊞</span>
          <span>{block.content || 'Database'}</span>
        </div>
      )
    }

    default:
      if (block.content) {
        return <p className="text-gray-600">{block.content}</p>
      }
      return null
  }
}

type GroupedBlocks = {
  type: 'list' | 'block'
  listType?: 'bulleted' | 'numbered'
  items: NotionBlock[]
}

function groupBlocks(blocks: NotionBlock[]): GroupedBlocks[] {
  const groups: GroupedBlocks[] = []

  for (const block of blocks) {
    const isBulleted = block.type === 'bulleted_list_item'
    const isNumbered = block.type === 'numbered_list_item'

    if (isBulleted || isNumbered) {
      const listType = isBulleted ? 'bulleted' : 'numbered'
      const last = groups[groups.length - 1]
      if (last?.type === 'list' && last.listType === listType) {
        last.items.push(block)
      } else {
        groups.push({ type: 'list', listType, items: [block] })
      }
    } else {
      groups.push({ type: 'block', items: [block] })
    }
  }

  return groups
}

export default function BlockRenderer({ blocks, childDatabases = [] }: { blocks: NotionBlock[]; childDatabases?: ChildDatabase[] }) {
  const groups = groupBlocks(blocks)

  return (
    <div className="notion-content text-gray-800 leading-relaxed">
      {groups.map((group, i) => {
        if (group.type === 'list') {
          const Tag = group.listType === 'numbered' ? 'ol' : 'ul'
          return (
            <Tag key={i} className={`my-2 pl-2 ${group.listType === 'numbered' ? 'list-decimal' : 'list-disc'}`}>
              {group.items.map(block => (
                <Block key={block.id} block={block} childDatabases={childDatabases} />
              ))}
            </Tag>
          )
        }
        return <Block key={i} block={group.items[0]} childDatabases={childDatabases} />
      })}
    </div>
  )
}
