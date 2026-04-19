-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zuvtlkcujewzfgbfwjwt/sql/new

CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID,
  calendar_data JSONB NOT NULL,
  period_start DATE,
  period_end DATE,
  total_posts INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_calendars_by_org" ON content_calendars
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
