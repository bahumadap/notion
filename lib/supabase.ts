import { createClient } from '@supabase/supabase-js'

// Server-side client (for API routes and server components)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Client-side singleton - lazy init to avoid build-time errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = new Proxy({}, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_: any, prop: string) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (_client as any)[prop]
    return typeof val === 'function' ? val.bind(_client) : val
  },
})

export type Page = {
  id: string
  notion_id: string | null
  title: string
  icon: string | null
  cover: string | null
  parent_id: string | null
  is_database: boolean
  db_schema: DatabaseSchema | null
  content: NotionBlock[] | null
  workspace_root: boolean
  created_at: string
  updated_at: string
  children?: Page[]
}

export type DbRecord = {
  id: string
  notion_id: string | null
  database_id: string
  title: string | null
  properties: Record<string, unknown>
  content: NotionBlock[] | null
  created_at: string
  updated_at: string
}

export type DatabaseColumn = {
  id: string
  name: string
  type: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'status' | 'relation' | 'person' | 'people' | 'files' | 'formula' | 'rollup' | 'created_time' | 'last_edited_time'
  options?: SelectOption[]
}

export type SelectOption = {
  id: string
  name: string
  color: string
}

export type DatabaseSchema = {
  columns: DatabaseColumn[]
}

export type NotionBlock = {
  id: string
  type: string
  content?: string
  children?: NotionBlock[]
  properties?: Record<string, unknown>
  level?: number
  language?: string
  url?: string
  caption?: string
  checked?: boolean
  color?: string
  icon?: string
}
