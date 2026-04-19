-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zuvtlkcujewzfgbfwjwt/sql/new

CREATE TABLE post_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  briefing_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'briefed',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, post_id)
);

ALTER TABLE post_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_briefings_by_org" ON post_briefings
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
