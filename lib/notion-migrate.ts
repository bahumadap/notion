/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from './supabase'
import type { NotionBlock, DatabaseSchema, DatabaseColumn, SelectOption } from './supabase'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

const WORKSPACE_ROOT_IDS = [
  'bd0996f3-c565-4121-b9f6-40607841b6dd', // Arch
  'c5558a86-5581-4850-a86a-d09ead32f545', // Intelligence & Ops
  'ffd15a03-064f-4979-aacc-f211da216b2c', // Arch | Join the team
  '178b09e8-8e31-83cd-8e1d-81baba62f8f6', // Engineering Wiki
  'dbab09e8-8e31-8331-9fb6-817367fa9903', // Product Wiki
  'efdb09e8-8e31-82ab-a6e6-0144f4fb2426', // Product Marketing
  'd11b09e8-8e31-83e1-ab5e-816fae488f5e', // Support Wiki
]

const EXCLUSION_PATTERNS = [
  /\bold\b/i,
  /deprecated/i,
  /archive/i,
  /legacy/i,
  /swag/i,
  /regalo/i,
  /gift/i,
  /influencer/i,
  /vendor/i,
]

function shouldExclude(title: string): boolean {
  return EXCLUSION_PATTERNS.some(pattern => pattern.test(title))
}

function notionFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

async function fetchAllPages<T>(
  fetcher: (cursor?: string) => Promise<Response>,
  key: string = 'results'
): Promise<T[]> {
  const results: T[] = []
  let cursor: string | undefined

  while (true) {
    const res = await fetcher(cursor)
    if (!res.ok) break
    const data = await res.json()
    results.push(...(data[key] || []))
    if (!data.has_more) break
    cursor = data.next_cursor
  }

  return results
}

function extractRichText(rich_text: any[]): string {
  if (!Array.isArray(rich_text)) return ''
  return rich_text.map((t: { plain_text?: string }) => t.plain_text || '').join('')
}

function convertBlock(block: any): NotionBlock {
  const base: NotionBlock = {
    id: block.id,
    type: block.type,
  }

  const b = block[block.type] || {}

  switch (block.type) {
    case 'paragraph':
      base.content = extractRichText(b.rich_text)
      base.color = b.color
      break
    case 'heading_1':
      base.content = extractRichText(b.rich_text)
      base.level = 1
      base.color = b.color
      break
    case 'heading_2':
      base.content = extractRichText(b.rich_text)
      base.level = 2
      base.color = b.color
      break
    case 'heading_3':
      base.content = extractRichText(b.rich_text)
      base.level = 3
      base.color = b.color
      break
    case 'bulleted_list_item':
    case 'numbered_list_item':
      base.content = extractRichText(b.rich_text)
      base.color = b.color
      break
    case 'to_do':
      base.content = extractRichText(b.rich_text)
      base.checked = b.checked
      break
    case 'toggle':
      base.content = extractRichText(b.rich_text)
      break
    case 'code':
      base.content = extractRichText(b.rich_text)
      base.language = b.language
      break
    case 'quote':
      base.content = extractRichText(b.rich_text)
      base.color = b.color
      break
    case 'callout':
      base.content = extractRichText(b.rich_text)
      base.icon = b.icon?.emoji || b.icon?.external?.url
      base.color = b.color
      break
    case 'divider':
      break
    case 'image':
      base.url = b.type === 'external' ? b.external?.url : b.file?.url
      base.caption = extractRichText(b.caption)
      break
    case 'video':
      base.url = b.type === 'external' ? b.external?.url : b.file?.url
      base.caption = extractRichText(b.caption)
      break
    case 'embed':
      base.url = b.url
      base.caption = extractRichText(b.caption)
      break
    case 'bookmark':
      base.url = b.url
      base.caption = extractRichText(b.caption)
      break
    case 'table_of_contents':
      break
    case 'child_page':
      base.content = b.title
      break
    case 'child_database':
      base.content = b.title
      break
    default:
      base.content = b.rich_text ? extractRichText(b.rich_text) : undefined
  }

  return base
}

function extractPageTitle(page: any): string {
  const titleProp = Object.values(page.properties || {}).find(
    (p: any) => p.type === 'title'
  ) as any
  if (titleProp) return extractRichText(titleProp.title)
  if (page.properties?.title?.title) return extractRichText(page.properties.title.title)
  return 'Untitled'
}

function extractIcon(page: any): string | null {
  if (!page.icon) return null
  if (page.icon.type === 'emoji') return page.icon.emoji
  if (page.icon.type === 'external') return page.icon.external?.url
  if (page.icon.type === 'file') return page.icon.file?.url
  return null
}

function extractCover(page: any): string | null {
  if (!page.cover) return null
  if (page.cover.type === 'external') return page.cover.external?.url
  if (page.cover.type === 'file') return page.cover.file?.url
  return null
}

function convertDatabaseSchema(properties: any): DatabaseSchema {
  const columns: DatabaseColumn[] = Object.entries(properties).map(([name, prop]: [string, any]) => {
    const col: DatabaseColumn = {
      id: prop.id,
      name,
      type: prop.type,
    }
    if (prop.select?.options) {
      col.options = prop.select.options as SelectOption[]
    }
    if (prop.multi_select?.options) {
      col.options = prop.multi_select.options as SelectOption[]
    }
    if (prop.status?.options) {
      col.options = prop.status.options as SelectOption[]
    }
    return col
  })
  return { columns }
}

function convertRecordProperties(properties: any): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, prop] of Object.entries(properties as Record<string, any>)) {
    const p = prop as any
    switch (p.type) {
      case 'title':
        result[key] = extractRichText(p.title)
        break
      case 'rich_text':
        result[key] = extractRichText(p.rich_text)
        break
      case 'number':
        result[key] = p.number
        break
      case 'select':
        result[key] = p.select?.name || null
        break
      case 'multi_select':
        result[key] = p.multi_select?.map((s: any) => s.name) || []
        break
      case 'status':
        result[key] = p.status?.name || null
        break
      case 'date':
        result[key] = p.date?.start || null
        break
      case 'checkbox':
        result[key] = p.checkbox
        break
      case 'url':
        result[key] = p.url
        break
      case 'email':
        result[key] = p.email
        break
      case 'phone_number':
        result[key] = p.phone_number
        break
      case 'people':
        result[key] = p.people?.map((u: any) => u.name || u.id) || []
        break
      case 'files':
        result[key] = p.files?.map((f: any) => f.external?.url || f.file?.url).filter(Boolean) || []
        break
      case 'created_time':
        result[key] = p.created_time
        break
      case 'last_edited_time':
        result[key] = p.last_edited_time
        break
      case 'formula':
        result[key] = p.formula?.string || p.formula?.number || p.formula?.boolean || null
        break
      default:
        result[key] = null
    }
  }

  return result
}

export type MigrationLog = {
  message: string
  type: 'info' | 'warn' | 'error' | 'success'
}

export async function runMigration(token: string): Promise<{ logs: MigrationLog[]; stats: Record<string, number> }> {
  const logs: MigrationLog[] = []
  const stats = { pages: 0, databases: 0, records: 0, skipped: 0 }
  const db = createServerClient()

  const log = (message: string, type: MigrationLog['type'] = 'info') => {
    logs.push({ message, type })
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  // Map of notion_id -> supabase_id
  const idMap = new Map<string, string>()

  async function fetchBlockChildren(blockId: string): Promise<any[]> {
    return fetchAllPages(
      (cursor) => notionFetch(
        `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`,
        token
      )
    )
  }

  async function processPage(notionPage: any, parentSupabaseId: string | null, isRoot: boolean = false) {
    const title = extractPageTitle(notionPage)
    const notionId = notionPage.id

    if (!isRoot && shouldExclude(title)) {
      log(`Skipping excluded page: "${title}"`, 'warn')
      stats.skipped++
      return
    }

    log(`Processing page: "${title}"`)

    // Fetch page content (blocks)
    const blocks = await fetchBlockChildren(notionId)
    const contentBlocks: NotionBlock[] = []
    const childPageBlocks: { notionId: string; title: string }[] = []

    for (const block of blocks) {
      if (block.type === 'child_page' || block.type === 'child_database') {
        childPageBlocks.push({ notionId: block.id, title: block[block.type].title })
      } else {
        const converted = convertBlock(block)
        if (block.has_children) {
          const childBlocks = await fetchBlockChildren(block.id)
          converted.children = childBlocks
            .filter(b => b.type !== 'child_page' && b.type !== 'child_database')
            .map(convertBlock)
        }
        contentBlocks.push(converted)
      }
    }

    // Insert page into Supabase
    const { data, error } = await db
      .from('pages')
      .upsert({
        notion_id: notionId,
        title,
        icon: extractIcon(notionPage),
        cover: extractCover(notionPage),
        parent_id: parentSupabaseId,
        is_database: false,
        content: contentBlocks,
        workspace_root: isRoot,
      }, { onConflict: 'notion_id' })
      .select('id')
      .single()

    if (error) {
      log(`Error saving page "${title}": ${error.message}`, 'error')
      return
    }

    const supabaseId = data.id
    idMap.set(notionId, supabaseId)
    stats.pages++

    // Process child pages
    for (const childRef of childPageBlocks) {
      if (shouldExclude(childRef.title)) {
        log(`Skipping excluded child: "${childRef.title}"`, 'warn')
        stats.skipped++
        continue
      }

      // Fetch the actual page/database object
      const childRes = await notionFetch(`/pages/${childRef.notionId}`, token)
      if (!childRes.ok) {
        // Try as database
        const dbRes = await notionFetch(`/databases/${childRef.notionId}`, token)
        if (dbRes.ok) {
          const dbData = await dbRes.json()
          await processDatabase(dbData, supabaseId)
        }
        continue
      }
      const childPage = await childRes.json()
      await processPage(childPage, supabaseId)
    }
  }

  async function processDatabase(notionDb: any, parentSupabaseId: string | null) {
    const titleArr = notionDb.title || []
    const title = titleArr.map((t: any) => t.plain_text).join('') || 'Untitled Database'

    if (shouldExclude(title)) {
      log(`Skipping excluded database: "${title}"`, 'warn')
      stats.skipped++
      return
    }

    log(`Processing database: "${title}"`)

    const schema = convertDatabaseSchema(notionDb.properties)

    const { data, error } = await db
      .from('pages')
      .upsert({
        notion_id: notionDb.id,
        title,
        icon: extractIcon(notionDb),
        cover: extractCover(notionDb),
        parent_id: parentSupabaseId,
        is_database: true,
        db_schema: schema,
        content: null,
        workspace_root: false,
      }, { onConflict: 'notion_id' })
      .select('id')
      .single()

    if (error) {
      log(`Error saving database "${title}": ${error.message}`, 'error')
      return
    }

    const supabaseId = data.id
    idMap.set(notionDb.id, supabaseId)
    stats.databases++

    // Fetch all records
    const records = await fetchAllPages(
      (cursor) => notionFetch(
        `/databases/${notionDb.id}/query`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
        }
      )
    )

    log(`  Found ${records.length} records in "${title}"`)

    for (const record of records as any[]) {
      const recordTitle = extractPageTitle(record)
      const properties = convertRecordProperties(record.properties)

      // Filter old records: skip if created before 2024
      const createdTime = record.created_time as string
      if (createdTime && new Date(createdTime).getFullYear() < 2024) {
        // Only filter CRM-like databases (heuristic: check if it has contact-like fields)
        const hasContactFields = Object.keys(record.properties).some(k =>
          /email|phone|contact|company|deal|lead/i.test(k)
        )
        if (hasContactFields) {
          log(`  Skipping old CRM record: "${recordTitle}" (${createdTime})`, 'warn')
          stats.skipped++
          continue
        }
      }

      if (shouldExclude(recordTitle)) {
        log(`  Skipping excluded record: "${recordTitle}"`, 'warn')
        stats.skipped++
        continue
      }

      // Fetch record content blocks
      const recordBlocks = await fetchBlockChildren(record.id)
      const content = recordBlocks
        .filter(b => b.type !== 'child_page' && b.type !== 'child_database')
        .map(convertBlock)

      const { error: recError } = await db
        .from('db_records')
        .upsert({
          notion_id: record.id,
          database_id: supabaseId,
          title: recordTitle,
          properties,
          content,
        }, { onConflict: 'notion_id' })

      if (recError) {
        log(`  Error saving record "${recordTitle}": ${recError.message}`, 'error')
      } else {
        stats.records++
      }
    }
  }

  log('Starting migration...', 'info')

  for (const rootId of WORKSPACE_ROOT_IDS) {
    log(`\nFetching workspace root: ${rootId}`)

    // Try as page first
    const pageRes = await notionFetch(`/pages/${rootId}`, token)
    if (pageRes.ok) {
      const page = await pageRes.json()
      await processPage(page, null, true)
      continue
    }

    // Try as database
    const dbRes = await notionFetch(`/databases/${rootId}`, token)
    if (dbRes.ok) {
      const db = await dbRes.json()
      await processDatabase(db, null)
      // Mark as workspace root
      const supId = idMap.get(rootId)
      if (supId) {
        await createServerClient()
          .from('pages')
          .update({ workspace_root: true })
          .eq('id', supId)
      }
      continue
    }

    log(`Could not fetch root ${rootId}`, 'error')
  }

  log(`\nMigration complete!`, 'success')
  log(`Pages: ${stats.pages}, Databases: ${stats.databases}, Records: ${stats.records}, Skipped: ${stats.skipped}`, 'success')

  return { logs, stats }
}
