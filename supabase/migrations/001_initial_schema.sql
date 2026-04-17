-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/zuvtlkcujewzfgbfwjwt/sql/new

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE org_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  business TEXT NOT NULL,
  pain_point TEXT NOT NULL,
  social_url TEXT,
  time_commitment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

CREATE TABLE marketing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  onboarding_id UUID REFERENCES onboarding_data(id),
  pillars JSONB NOT NULL,
  frequency TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES marketing_strategies(id),
  post_date DATE NOT NULL,
  post_type TEXT NOT NULL,
  pillar TEXT NOT NULL,
  caption TEXT NOT NULL,
  visual_brief TEXT NOT NULL,
  hashtags TEXT[],
  best_time TIME,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org_ids
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid()
$$;

CREATE POLICY "members_see_own_orgs" ON organizations
  FOR SELECT USING (id IN (SELECT user_org_ids()));

CREATE POLICY "org_members_all" ON organization_members
  FOR ALL USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "invitations_by_org" ON org_invitations
  FOR ALL USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "onboarding_by_org" ON onboarding_data
  FOR ALL USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "strategies_by_org" ON marketing_strategies
  FOR ALL USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "calendar_by_org" ON content_calendar
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
