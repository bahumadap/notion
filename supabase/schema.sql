-- Arch Wiki - Supabase Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id TEXT UNIQUE,
  title TEXT NOT NULL,
  icon TEXT,
  cover TEXT,
  parent_id UUID REFERENCES pages(id),
  is_database BOOLEAN DEFAULT false,
  db_schema JSONB,
  content JSONB,
  workspace_root BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS db_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id TEXT UNIQUE,
  database_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT,
  properties JSONB,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_root ON pages(workspace_root);
CREATE INDEX IF NOT EXISTS idx_pages_notion_id ON pages(notion_id);
CREATE INDEX IF NOT EXISTS idx_db_records_database_id ON db_records(database_id);
CREATE INDEX IF NOT EXISTS idx_db_records_notion_id ON db_records(notion_id);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_pages_title_fts ON pages USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_db_records_title_fts ON db_records USING gin(to_tsvector('english', coalesce(title, '')));

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER db_records_updated_at
  BEFORE UPDATE ON db_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
