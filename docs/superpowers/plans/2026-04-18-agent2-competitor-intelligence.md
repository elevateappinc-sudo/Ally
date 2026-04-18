# Agent 2: Competitor Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Agent 2 that takes the intake business brief, scrapes competitor websites + Google Reviews, analyzes with Claude, and shows a structured Competitor Intelligence Report in the dashboard.

**Architecture:** The POST `/api/agents/competitor/analyze` endpoint runs synchronously (up to 300s via Vercel `maxDuration`), scraping website HTML with cheerio and Google Reviews via Places API, then sends all raw data to Claude for structured analysis. Results are saved to a new `competitor_analyses` Supabase table and displayed in a new dashboard section. Instagram scraping via Apify is gated behind `APIFY_API_TOKEN` — the agent works without it.

**Tech Stack:** Next.js 16 App Router, Supabase (DB + auth), Anthropic Claude (`claude-sonnet-4-6`), `cheerio` (HTML parsing), Google Places REST API, Apify REST API (optional)

---

## File Structure

**New files:**
- `lib/agents/competitor/websiteScraper.ts` — fetch + cheerio, extracts title/meta/h1/links/tech signals
- `lib/agents/competitor/googlePlaces.ts` — Google Places REST API, returns rating + top reviews
- `lib/agents/competitor/apifyInstagram.ts` — Apify run-sync, returns profile + recent posts data
- `lib/agents/competitor/claudeAnalysis.ts` — prompts + parsing for individual and cross-competitor analysis
- `lib/agents/competitor/orchestrator.ts` — sequences scrapers, calls Claude, saves to DB
- `app/api/agents/competitor/analyze/route.ts` — POST, triggers orchestrator
- `app/api/agents/competitor/analysis/[id]/route.ts` — GET, returns status + result
- `app/(app)/competitor/[id]/page.tsx` — server component, auth + orgId check
- `app/(app)/competitor/[id]/CompetitorReportClient.tsx` — full report UI
- `components/competitor/CompetitorCard.tsx` — summary card per competitor

**Modified files:**
- `lib/supabase/types.ts` — add `CompetitorAnalysis` type
- `app/api/intake/chat/route.ts` — auto-trigger Agent 2 when `isComplete = true`
- `app/(app)/intake/IntakeClient.tsx` — redirect to `/competitor/[id]` after complete instead of dashboard
- `proxy.ts` — add `/competitor` to skip list

---

## Task 1: DB Schema

**Files:**
- Run SQL in Supabase dashboard

- [ ] **Step 1: Run this SQL in Supabase SQL editor**

```sql
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  org_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',  -- 'processing' | 'completed' | 'failed'
  analysis_data JSONB,
  competitors_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_analyses_session ON competitor_analyses(session_id);
CREATE INDEX idx_competitor_analyses_org ON competitor_analyses(org_id);

ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own org analyses"
  ON competitor_analyses FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can write analyses"
  ON competitor_analyses FOR ALL
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 2: Verify table exists**

Go to Supabase → Table Editor → confirm `competitor_analyses` appears.

- [ ] **Step 3: Commit note**

```bash
git commit --allow-empty -m "infra: add competitor_analyses table (applied in Supabase dashboard)"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Add types to the end of `lib/supabase/types.ts`**

```typescript
export interface CompetitorAnalysis {
  id: string
  session_id: string
  org_id: string
  status: 'processing' | 'completed' | 'failed'
  analysis_data: CompetitorAnalysisReport | null
  competitors_count: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface CompetitorAnalysisReport {
  session_id: string
  analysis_date: string
  competitors_analyzed: number
  industry_benchmarks: {
    avg_posting_frequency: string
    avg_engagement_rate: string
    common_content_types: string[]
    trending_hashtags: string[]
  }
  competitor_analyses: AnalyzedCompetitor[]
  gap_analysis: {
    underserved_segments: string[]
    content_gaps: string[]
    positioning_gaps: string[]
  }
  recommendations: CompetitorRecommendation[]
  competitive_matrix: {
    dimensions: Array<{
      dimension: string
      client_position: number
      competitors: Array<{ name: string; position: number }>
    }>
  }
  summary: {
    main_insight: string
    biggest_threat: string
    biggest_opportunity: string
    key_differentiator: string
  }
}

export interface AnalyzedCompetitor {
  name: string
  overall_score: number
  digital_presence_strength: 'low' | 'medium' | 'high'
  threat_level: 'low' | 'medium' | 'high'
  direct_competition: boolean
  website_analysis: {
    url: string
    title: string
    description: string
    has_online_store: boolean
    has_blog: boolean
    has_menu: boolean
    h1_tags: string[]
    available: boolean
  } | null
  google_reviews: {
    rating: number
    total_reviews: number
    recent_reviews: Array<{ text: string; rating: number; time: string }>
    available: boolean
  } | null
  instagram: {
    handle: string
    followers: number
    posts_count: number
    bio: string
    available: boolean
  } | null
  value_proposition: {
    positioning: string
    target_audience: string
    price_positioning: 'budget' | 'mid-range' | 'premium' | 'luxury'
    key_differentiators: string[]
  }
  strengths: string[]
  weaknesses: string[]
  opportunities_for_client: string[]
  sources_succeeded: string[]
  sources_failed: string[]
}

export interface CompetitorRecommendation {
  priority: 'low' | 'medium' | 'high'
  category: 'positioning' | 'content' | 'channel' | 'engagement' | 'pricing' | 'other'
  recommendation: string
  reasoning: string
  expected_impact: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing errors unrelated to types.ts)

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add CompetitorAnalysis TypeScript types"
```

---

## Task 3: Install cheerio

**Files:**
- `package.json`

- [ ] **Step 1: Install cheerio**

```bash
npm install cheerio
```

- [ ] **Step 2: Verify install**

```bash
node -e "const c = require('cheerio'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add cheerio for HTML parsing"
```

---

## Task 4: Website Scraper

**Files:**
- Create: `lib/agents/competitor/websiteScraper.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/agents/competitor/websiteScraper.ts
import * as cheerio from 'cheerio'

export interface WebsiteData {
  url: string
  title: string
  description: string
  has_online_store: boolean
  has_blog: boolean
  has_menu: boolean
  h1_tags: string[]
  available: boolean
  error?: string
}

export async function scrapeWebsite(url: string): Promise<WebsiteData> {
  const base: WebsiteData = {
    url, title: '', description: '', has_online_store: false,
    has_blog: false, has_menu: false, h1_tags: [], available: false,
  }

  if (!url) return base

  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    const res = await fetch(normalized, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SofiaBot/1.0)' },
    })
    if (!res.ok) return { ...base, error: `HTTP ${res.status}` }

    const html = await res.text()
    const $ = cheerio.load(html)

    const bodyText = $('body').text().toLowerCase()
    const allHrefs = $('a').map((_, el) => $(el).attr('href') || '').get().join(' ').toLowerCase()

    return {
      url: normalized,
      title: $('title').text().trim().slice(0, 200),
      description: ($('meta[name="description"]').attr('content') || '').trim().slice(0, 500),
      has_online_store: allHrefs.includes('cart') || allHrefs.includes('shop') || bodyText.includes('agregar al carrito') || bodyText.includes('add to cart'),
      has_blog: allHrefs.includes('blog') || allHrefs.includes('noticias') || allHrefs.includes('articulos'),
      has_menu: allHrefs.includes('menu') || bodyText.includes('menú') || bodyText.includes('menu'),
      h1_tags: $('h1').map((_, el) => $(el).text().trim()).get().slice(0, 5),
      available: true,
    }
  } catch (err: any) {
    return { ...base, error: err?.message ?? 'Unknown error' }
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | grep websiteScraper
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add lib/agents/competitor/websiteScraper.ts
git commit -m "feat: add website scraper with cheerio"
```

---

## Task 5: Google Places Service

**Files:**
- Create: `lib/agents/competitor/googlePlaces.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/agents/competitor/googlePlaces.ts

export interface GoogleReviewsData {
  rating: number
  total_reviews: number
  recent_reviews: Array<{ text: string; rating: number; time: string }>
  available: boolean
  error?: string
}

async function findPlaceId(name: string, location: string, apiKey: string): Promise<string | null> {
  const query = encodeURIComponent(`${name} ${location}`)
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  return data?.candidates?.[0]?.place_id ?? null
}

export async function getGoogleReviews(
  competitorName: string,
  location: string
): Promise<GoogleReviewsData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return { rating: 0, total_reviews: 0, recent_reviews: [], available: false, error: 'GOOGLE_PLACES_API_KEY not set' }
  }

  try {
    const placeId = await findPlaceId(competitorName, location, apiKey)
    if (!placeId) {
      return { rating: 0, total_reviews: 0, recent_reviews: [], available: false, error: 'Place not found' }
    }

    const fields = 'rating,user_ratings_total,reviews'
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=es`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    const result = data?.result

    if (!result) return { rating: 0, total_reviews: 0, recent_reviews: [], available: false, error: 'No result' }

    return {
      rating: result.rating ?? 0,
      total_reviews: result.user_ratings_total ?? 0,
      recent_reviews: (result.reviews ?? []).slice(0, 5).map((r: any) => ({
        text: r.text ?? '',
        rating: r.rating ?? 0,
        time: r.relative_time_description ?? '',
      })),
      available: true,
    }
  } catch (err: any) {
    return { rating: 0, total_reviews: 0, recent_reviews: [], available: false, error: err?.message }
  }
}
```

- [ ] **Step 2: Add env var to `.env.local`**

```bash
# Add this line to .env.local (create if it doesn't exist)
# GOOGLE_PLACES_API_KEY=your_key_here
# Leave commented if you don't have a key yet — agent works without it
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep googlePlaces
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add lib/agents/competitor/googlePlaces.ts
git commit -m "feat: add Google Places reviews service"
```

---

## Task 6: Apify Instagram Service (optional)

**Files:**
- Create: `lib/agents/competitor/apifyInstagram.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/agents/competitor/apifyInstagram.ts

export interface InstagramData {
  handle: string
  followers: number
  following: number
  posts_count: number
  bio: string
  verified: boolean
  recent_posts: Array<{
    likes: number
    comments: number
    type: string
    caption: string
    timestamp: string
    hashtags: string[]
  }>
  available: boolean
  error?: string
}

function extractUsername(url: string): string {
  // handles https://instagram.com/username or @username or username
  const match = url.match(/instagram\.com\/([^/?]+)/)
  if (match) return match[1]
  return url.replace('@', '').trim()
}

export async function scrapeInstagram(instagramUrl: string): Promise<InstagramData> {
  const empty: InstagramData = {
    handle: '', followers: 0, following: 0, posts_count: 0,
    bio: '', verified: false, recent_posts: [], available: false,
  }

  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) return { ...empty, error: 'APIFY_API_TOKEN not set' }
  if (!instagramUrl) return { ...empty, error: 'No URL provided' }

  const username = extractUsername(instagramUrl)

  try {
    // Use Apify's synchronous run endpoint — blocks until done, returns dataset items
    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=120`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: 'posts',
        resultsLimit: 20,
        addParentData: true,
      }),
      signal: AbortSignal.timeout(130000), // 130s > Apify 120s timeout
    })

    if (!res.ok) return { ...empty, error: `Apify HTTP ${res.status}` }

    const items: any[] = await res.json()
    if (!items?.length) return { ...empty, handle: username, error: 'No data returned' }

    // First item has profile + posts
    const profile = items[0]?.ownerUsername ? items[0] : null
    const posts = items.filter(i => i.likesCount !== undefined)

    const avgLikes = posts.length
      ? Math.round(posts.reduce((s, p) => s + (p.likesCount ?? 0), 0) / posts.length)
      : 0

    return {
      handle: username,
      followers: profile?.followersCount ?? 0,
      following: profile?.followingCount ?? 0,
      posts_count: profile?.postsCount ?? posts.length,
      bio: profile?.biography ?? '',
      verified: profile?.verified ?? false,
      recent_posts: posts.slice(0, 20).map((p: any) => ({
        likes: p.likesCount ?? 0,
        comments: p.commentsCount ?? 0,
        type: p.type ?? 'image',
        caption: (p.caption ?? '').slice(0, 300),
        timestamp: p.timestamp ?? '',
        hashtags: (p.hashtags ?? []).slice(0, 15),
      })),
      available: true,
    }
  } catch (err: any) {
    return { ...empty, handle: username, error: err?.message }
  }
}
```

- [ ] **Step 2: Add env var note to `.env.local`**

```
# APIFY_API_TOKEN=your_token_here
# Get free token at apify.com — free tier gives $5/month credit
# Leave commented to skip Instagram scraping
```

- [ ] **Step 3: Commit**

```bash
git add lib/agents/competitor/apifyInstagram.ts
git commit -m "feat: add Apify Instagram scraper (optional, gated by env var)"
```

---

## Task 7: Claude Analysis Service

**Files:**
- Create: `lib/agents/competitor/claudeAnalysis.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/agents/competitor/claudeAnalysis.ts
import { getAnthropicClient } from '@/lib/anthropic'
import type { AnalyzedCompetitor, CompetitorAnalysisReport, CompetitorRecommendation } from '@/lib/supabase/types'
import type { WebsiteData } from './websiteScraper'
import type { GoogleReviewsData } from './googlePlaces'
import type { InstagramData } from './apifyInstagram'

interface RawCompetitorData {
  name: string
  perceived_strengths: string
  perceived_weaknesses: string
  website: WebsiteData | null
  google_reviews: GoogleReviewsData | null
  instagram: InstagramData | null
  sources_succeeded: string[]
  sources_failed: string[]
}

interface BusinessContext {
  name: string
  industry: string
  location: string
  primary_goal: string
}

function parseJSON<T>(text: string, fallback: T): T {
  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try { return JSON.parse(cleaned) } catch { return fallback }
}

export async function analyzeCompetitor(
  raw: RawCompetitorData,
  business: BusinessContext
): Promise<AnalyzedCompetitor> {
  const anthropic = getAnthropicClient()

  const prompt = `You are an expert digital marketing analyst. Analyze this competitor for a small business client.

CLIENT:
- Business: ${business.name}
- Industry: ${business.industry}
- Location: ${business.location}
- Primary goal: ${business.primary_goal}

COMPETITOR: ${raw.name}
Client's perceived strengths: ${raw.perceived_strengths || 'Not specified'}
Client's perceived weaknesses: ${raw.perceived_weaknesses || 'Not specified'}

DATA COLLECTED:

WEBSITE:
${raw.website?.available ? JSON.stringify(raw.website, null, 2) : 'Not available'}

GOOGLE REVIEWS:
${raw.google_reviews?.available ? JSON.stringify(raw.google_reviews, null, 2) : 'Not available'}

INSTAGRAM:
${raw.instagram?.available ? JSON.stringify(raw.instagram, null, 2) : 'Not available'}

DATA SOURCES: succeeded=${raw.sources_succeeded.join(',')} failed=${raw.sources_failed.join(',')}

Based on available data (and your general knowledge of this type of business when data is limited), provide a complete analysis. Be specific and actionable. Base insights on data when available, on reasonable inference when not.

Respond with ONLY this JSON (no markdown, no explanation):
{
  "name": "${raw.name}",
  "overall_score": 7,
  "digital_presence_strength": "medium",
  "threat_level": "medium",
  "direct_competition": true,
  "value_proposition": {
    "positioning": "...",
    "target_audience": "...",
    "price_positioning": "mid-range",
    "key_differentiators": ["...", "..."]
  },
  "strengths": ["specific strength with evidence", "..."],
  "weaknesses": ["specific weakness with evidence", "..."],
  "opportunities_for_client": ["specific actionable opportunity", "..."]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const parsed = parseJSON<Partial<AnalyzedCompetitor>>(text, {})

  return {
    name: raw.name,
    overall_score: parsed.overall_score ?? 5,
    digital_presence_strength: parsed.digital_presence_strength ?? 'medium',
    threat_level: parsed.threat_level ?? 'medium',
    direct_competition: parsed.direct_competition ?? true,
    website_analysis: raw.website?.available ? {
      url: raw.website.url,
      title: raw.website.title,
      description: raw.website.description,
      has_online_store: raw.website.has_online_store,
      has_blog: raw.website.has_blog,
      has_menu: raw.website.has_menu,
      h1_tags: raw.website.h1_tags,
      available: true,
    } : null,
    google_reviews: raw.google_reviews?.available ? {
      rating: raw.google_reviews.rating,
      total_reviews: raw.google_reviews.total_reviews,
      recent_reviews: raw.google_reviews.recent_reviews,
      available: true,
    } : null,
    instagram: raw.instagram?.available ? {
      handle: raw.instagram.handle,
      followers: raw.instagram.followers,
      posts_count: raw.instagram.posts_count,
      bio: raw.instagram.bio,
      available: true,
    } : null,
    value_proposition: parsed.value_proposition ?? {
      positioning: '', target_audience: '', price_positioning: 'mid-range', key_differentiators: [],
    },
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    opportunities_for_client: parsed.opportunities_for_client ?? [],
    sources_succeeded: raw.sources_succeeded,
    sources_failed: raw.sources_failed,
  }
}

export async function generateCrossAnalysis(
  competitorAnalyses: AnalyzedCompetitor[],
  business: BusinessContext
): Promise<Pick<CompetitorAnalysisReport, 'industry_benchmarks' | 'gap_analysis' | 'competitive_matrix' | 'recommendations' | 'summary'>> {
  const anthropic = getAnthropicClient()

  const prompt = `You are an expert digital marketing strategist. You have analyzed ${competitorAnalyses.length} competitors for a client.

CLIENT: ${business.name} | ${business.industry} | ${business.location}
Goal: ${business.primary_goal}

INDIVIDUAL ANALYSES:
${JSON.stringify(competitorAnalyses, null, 2)}

Now provide a CROSS-COMPETITOR strategic analysis. Be specific and actionable. No generic advice.

Respond with ONLY this JSON (no markdown):
{
  "industry_benchmarks": {
    "avg_posting_frequency": "X posts/week",
    "avg_engagement_rate": "X%",
    "common_content_types": ["..."],
    "trending_hashtags": ["..."]
  },
  "gap_analysis": {
    "underserved_segments": ["specific segment not being served well", "..."],
    "content_gaps": ["content type none of them do well", "..."],
    "positioning_gaps": ["positioning space that's empty", "..."]
  },
  "competitive_matrix": {
    "dimensions": [
      {
        "dimension": "Precio",
        "client_position": 5,
        "competitors": [{"name": "...", "position": 7}]
      },
      {
        "dimension": "Presencia digital",
        "client_position": 3,
        "competitors": [{"name": "...", "position": 8}]
      }
    ]
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "positioning",
      "recommendation": "Specific action to take",
      "reasoning": "Why this matters based on competitor data",
      "expected_impact": "What this will achieve"
    }
  ],
  "summary": {
    "main_insight": "One sentence insight about the competitive landscape",
    "biggest_threat": "Competitor name and why they're the biggest threat",
    "biggest_opportunity": "Specific gap or opportunity to exploit",
    "key_differentiator": "What the client should lead with to differentiate"
  }
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const parsed = parseJSON<any>(text, {})

  return {
    industry_benchmarks: parsed.industry_benchmarks ?? {
      avg_posting_frequency: 'N/A', avg_engagement_rate: 'N/A',
      common_content_types: [], trending_hashtags: [],
    },
    gap_analysis: parsed.gap_analysis ?? {
      underserved_segments: [], content_gaps: [], positioning_gaps: [],
    },
    competitive_matrix: parsed.competitive_matrix ?? { dimensions: [] },
    recommendations: parsed.recommendations ?? [],
    summary: parsed.summary ?? {
      main_insight: '', biggest_threat: '', biggest_opportunity: '', key_differentiator: '',
    },
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep claudeAnalysis
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add lib/agents/competitor/claudeAnalysis.ts
git commit -m "feat: add Claude analysis service for competitor intelligence"
```

---

## Task 8: Orchestrator

**Files:**
- Create: `lib/agents/competitor/orchestrator.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/agents/competitor/orchestrator.ts
import { createClient } from '@/lib/supabase/server'
import { scrapeWebsite } from './websiteScraper'
import { getGoogleReviews } from './googlePlaces'
import { scrapeInstagram } from './apifyInstagram'
import { analyzeCompetitor, generateCrossAnalysis } from './claudeAnalysis'
import type { CompetitorAnalysisReport } from '@/lib/supabase/types'

interface Competitor {
  name: string
  urls?: {
    instagram?: string
    facebook?: string
    website?: string
  }
  perceived_strengths?: string
  perceived_weaknesses?: string
}

interface BusinessBrief {
  session_id?: string
  business_info: {
    name: string
    industry: string
    location: string
  }
  objectives?: { primary_goal?: string }
  competitors?: Competitor[]
}

export async function runCompetitorAnalysis(
  analysisId: string,
  brief: BusinessBrief,
  orgId: string
): Promise<void> {
  const supabase = await createClient()

  const updateStatus = async (status: string, extra: object = {}) => {
    await supabase.from('competitor_analyses').update({
      status, updated_at: new Date().toISOString(), ...extra,
    }).eq('id', analysisId)
  }

  try {
    const competitors: Competitor[] = brief.competitors?.length
      ? brief.competitors.slice(0, 4) // max 4 competitors
      : []

    if (!competitors.length) {
      await updateStatus('failed', { error_message: 'No competitors in brief' })
      return
    }

    const business = {
      name: brief.business_info.name,
      industry: brief.business_info.industry,
      location: brief.business_info.location,
      primary_goal: brief.objectives?.primary_goal ?? 'grow business',
    }

    // Analyze each competitor sequentially (avoid rate limits)
    const competitorAnalyses = []
    for (const competitor of competitors) {
      const sources_succeeded: string[] = []
      const sources_failed: string[] = []

      // Website scraping
      let website = null
      if (competitor.urls?.website) {
        website = await scrapeWebsite(competitor.urls.website)
        if (website.available) sources_succeeded.push('website')
        else sources_failed.push('website')
      }

      // Google Reviews
      const googleReviews = await getGoogleReviews(competitor.name, business.location)
      if (googleReviews.available) sources_succeeded.push('google_reviews')
      else sources_failed.push('google_reviews')

      // Instagram (optional — only if Apify token set)
      let instagram = null
      if (competitor.urls?.instagram && process.env.APIFY_API_TOKEN) {
        instagram = await scrapeInstagram(competitor.urls.instagram)
        if (instagram.available) sources_succeeded.push('instagram')
        else sources_failed.push('instagram')
      }

      // Claude analysis (always runs — uses available data + general knowledge)
      const analysis = await analyzeCompetitor({
        name: competitor.name,
        perceived_strengths: competitor.perceived_strengths ?? '',
        perceived_weaknesses: competitor.perceived_weaknesses ?? '',
        website,
        google_reviews: googleReviews,
        instagram,
        sources_succeeded,
        sources_failed,
      }, business)

      competitorAnalyses.push(analysis)
    }

    // Cross-competitor analysis
    const crossAnalysis = await generateCrossAnalysis(competitorAnalyses, business)

    const report: CompetitorAnalysisReport = {
      session_id: brief.session_id ?? analysisId,
      analysis_date: new Date().toISOString(),
      competitors_analyzed: competitorAnalyses.length,
      ...crossAnalysis,
      competitor_analyses: competitorAnalyses,
    }

    await updateStatus('completed', {
      analysis_data: report,
      competitors_count: competitorAnalyses.length,
    })
  } catch (err: any) {
    await updateStatus('failed', { error_message: err?.message ?? 'Unknown error' })
    throw err
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep orchestrator
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add lib/agents/competitor/orchestrator.ts
git commit -m "feat: add competitor analysis orchestrator"
```

---

## Task 9: API Routes

**Files:**
- Create: `app/api/agents/competitor/analyze/route.ts`
- Create: `app/api/agents/competitor/analysis/[id]/route.ts`

- [ ] **Step 1: Create the analyze POST route**

```typescript
// app/api/agents/competitor/analyze/route.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { runCompetitorAnalysis } from '@/lib/agents/competitor/orchestrator'

// Allow up to 300s on Vercel Pro — basic analysis fits in 60s (Hobby plan)
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, business_brief } = await request.json()
  if (!business_brief) return NextResponse.json({ error: 'Missing business_brief' }, { status: 400 })

  const cookieStore = await cookies()
  let orgId = cookieStore.get('active_org_id')?.value
  if (!orgId) {
    const { data: member } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'No org' }, { status: 400 })
    orgId = member.org_id
  }

  // Create analysis record
  const { data: record, error } = await supabase
    .from('competitor_analyses')
    .insert({ session_id, org_id: orgId, status: 'processing' })
    .select('id').single()

  if (error || !record) {
    return NextResponse.json({ error: 'Failed to create analysis record' }, { status: 500 })
  }

  // Run analysis synchronously (response waits for completion)
  try {
    await runCompetitorAnalysis(record.id, business_brief, orgId)
    return NextResponse.json({ analysis_id: record.id, status: 'completed' })
  } catch {
    return NextResponse.json({ analysis_id: record.id, status: 'failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the GET polling route**

```typescript
// app/api/agents/competitor/analysis/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('competitor_analyses')
    .select('id, status, analysis_data, competitors_count, error_message, created_at')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "analyze|analysis"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add app/api/agents/competitor/
git commit -m "feat: add competitor analysis API routes (POST trigger + GET poll)"
```

---

## Task 10: Auto-Trigger from Agent 1

**Files:**
- Modify: `app/api/intake/chat/route.ts`

- [ ] **Step 1: Read current file to find the isComplete block**

The current `app/api/intake/chat/route.ts` has this block around line 116:

```typescript
if (sessionId && businessBrief) {
  await supabase.from('intake_sessions').update({
    business_brief: businessBrief,
    status: 'complete',
    updated_at: new Date().toISOString(),
  }).eq('id', sessionId)
}
```

- [ ] **Step 2: Add auto-trigger after saving the brief**

Replace that block with:

```typescript
if (sessionId && businessBrief) {
  await supabase.from('intake_sessions').update({
    business_brief: businessBrief,
    status: 'complete',
    updated_at: new Date().toISOString(),
  }).eq('id', sessionId)

  // Auto-trigger Agent 2 — fire and forget (don't await, not blocking response)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/agents/competitor/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': '' },
    body: JSON.stringify({ session_id: sessionId, business_brief: businessBrief }),
  }).catch(err => console.error('[intake] Agent 2 trigger failed:', err))
}
```

**Important note:** The fire-and-forget `fetch` here will be cut off by Vercel when the parent request ends in serverless. The correct production solution is to return the `analysis_id` from the intake completion response and have the client call Agent 2 directly. This task sets up the foundation.

- [ ] **Step 3: Update intake chat response to include session_id**

In the same file, update the final `return NextResponse.json(...)` to include `sessionId`:

```typescript
return NextResponse.json({ response: responseText, isComplete, businessBrief, sessionId })
```

- [ ] **Step 4: Commit**

```bash
git add app/api/intake/chat/route.ts
git commit -m "feat: pass sessionId in intake response for Agent 2 trigger"
```

---

## Task 11: IntakeClient Triggers Agent 2

**Files:**
- Modify: `app/(app)/intake/IntakeClient.tsx`

- [ ] **Step 1: Read the complete useEffect for status === 'complete'**

Currently around line 250-265 in IntakeClient.tsx:
```typescript
useEffect(() => {
  if (status !== 'complete') return
  isListeningRef.current = false
  recognitionRef.current?.stop()
  stream?.getTracks().forEach(t => t.stop())

  const generate = async () => {
    await fetch('/api/generate-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    router.push('/dashboard')
  }
  generate()
}, [status, orgId, stream, router])
```

- [ ] **Step 2: Replace with Agent 2 trigger**

```typescript
useEffect(() => {
  if (status !== 'complete') return
  isListeningRef.current = false
  recognitionRef.current?.stop()
  stream?.getTracks().forEach(t => t.stop())

  const triggerAgent2 = async () => {
    // Find the completed intake session to get the business_brief
    const lastAssistantMsg = history.findLast(t => t.role === 'assistant')
    if (!lastAssistantMsg) { router.push('/dashboard'); return }

    // Call Agent 2 with the business brief from the last intake API response
    // businessBrief is stored in state — need to capture it from sendMessage
    // For now, redirect to a loading page that triggers analysis
    router.push(`/dashboard?agent2=starting`)
  }
  triggerAgent2()
}, [status, orgId, stream, router, history])
```

**Note:** The businessBrief needs to be captured in state when `sendMessage` receives `isComplete: true`. Add state for it:

- [ ] **Step 3: Add businessBrief state and capture it in sendMessage**

At the top of IntakeClient (near other useState calls), add:
```typescript
const [businessBrief, setBusinessBrief] = useState<any>(null)
const [analysisId, setAnalysisId] = useState<string | null>(null)
```

In `sendMessage`, after `const { response, isComplete } = await res.json()`, add:
```typescript
const { response, isComplete, businessBrief: brief } = await res.json()
if (brief) setBusinessBrief(brief)
```

- [ ] **Step 4: Update the complete effect to call Agent 2**

```typescript
useEffect(() => {
  if (status !== 'complete' || !businessBrief) return
  isListeningRef.current = false
  recognitionRef.current?.stop()
  stream?.getTracks().forEach(t => t.stop())

  const triggerAgent2 = async () => {
    try {
      const res = await fetch('/api/agents/competitor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, business_brief: businessBrief }),
      })
      const data = await res.json()
      if (data.analysis_id) {
        router.push(`/competitor/${data.analysis_id}`)
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/dashboard')
    }
  }
  triggerAgent2()
}, [status, businessBrief, sessionId, stream, router])
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/intake/IntakeClient.tsx
git commit -m "feat: intake triggers Agent 2 and redirects to competitor report"
```

---

## Task 12: Competitor Report Page

**Files:**
- Create: `app/(app)/competitor/[id]/page.tsx`
- Create: `app/(app)/competitor/[id]/CompetitorReportClient.tsx`

- [ ] **Step 1: Create server component**

```typescript
// app/(app)/competitor/[id]/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompetitorReportClient } from './CompetitorReportClient'

export default async function CompetitorReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!analysis) redirect('/dashboard')

  return <CompetitorReportClient analysis={analysis} />
}
```

- [ ] **Step 2: Create client component**

```typescript
// app/(app)/competitor/[id]/CompetitorReportClient.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CompetitorAnalysis, CompetitorAnalysisReport, AnalyzedCompetitor } from '@/lib/supabase/types'

interface Props { analysis: CompetitorAnalysis }

export function CompetitorReportClient({ analysis: initial }: Props) {
  const router = useRouter()
  const [analysis, setAnalysis] = useState(initial)

  // Poll while processing
  useEffect(() => {
    if (analysis.status !== 'processing') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/agents/competitor/analysis/${analysis.id}`)
      if (!res.ok) return
      const updated = await res.json()
      setAnalysis(updated)
      if (updated.status !== 'processing') clearInterval(interval)
    }, 5000)
    return () => clearInterval(interval)
  }, [analysis.id, analysis.status])

  if (analysis.status === 'processing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analizando competidores...</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Sofía está investigando el mercado. Esto toma 1-3 minutos.</p>
        </div>
      </div>
    )
  }

  if (analysis.status === 'failed') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--siri-pink)', fontSize: 18 }}>El análisis falló. {analysis.error_message}</p>
        <button onClick={() => router.push('/dashboard')} className="btn btn-primary">Ir al dashboard</button>
      </div>
    )
  }

  const report = analysis.analysis_data as CompetitorAnalysisReport
  if (!report) return null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Análisis de <span className="gradient-text">Competidores</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          {report.competitors_analyzed} competidores analizados · {new Date(report.analysis_date).toLocaleDateString('es-AR')}
        </p>
      </div>

      {/* Summary */}
      <div className="glass" style={{ padding: 24, marginBottom: 24, borderLeft: '3px solid #a855f7' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Resumen Ejecutivo</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div><span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Insight principal</span><p style={{ marginTop: 4 }}>{report.summary.main_insight}</p></div>
          <div><span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Mayor amenaza</span><p style={{ marginTop: 4, color: '#f87171' }}>{report.summary.biggest_threat}</p></div>
          <div><span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Mayor oportunidad</span><p style={{ marginTop: 4, color: '#4ade80' }}>{report.summary.biggest_opportunity}</p></div>
          <div><span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Tu diferenciador clave</span><p style={{ marginTop: 4, color: '#a855f7', fontWeight: 600 }}>{report.summary.key_differentiator}</p></div>
        </div>
      </div>

      {/* Competitors */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Competidores</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {report.competitor_analyses.map(comp => (
          <CompetitorCard key={comp.name} competitor={comp} />
        ))}
      </div>

      {/* Recommendations */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recomendaciones Estratégicas</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {report.recommendations.map((rec, i) => (
          <div key={i} className="glass" style={{ padding: 20, borderLeft: `3px solid ${rec.priority === 'high' ? '#a855f7' : rec.priority === 'medium' ? '#06b6d4' : '#6b7280'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: rec.priority === 'high' ? 'rgba(168,85,247,0.2)' : 'rgba(6,182,212,0.2)', color: rec.priority === 'high' ? '#a855f7' : '#06b6d4', fontWeight: 600, textTransform: 'uppercase' }}>{rec.priority}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'capitalize' }}>{rec.category}</span>
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{rec.recommendation}</p>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 4 }}>{rec.reasoning}</p>
            <p style={{ fontSize: 14, color: '#4ade80' }}>Impacto esperado: {rec.expected_impact}</p>
          </div>
        ))}
      </div>

      {/* Gap Analysis */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Gaps del Mercado</h2>
      <div className="glass" style={{ padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          {[
            { label: 'Segmentos sin atender', items: report.gap_analysis.underserved_segments, color: '#a855f7' },
            { label: 'Gaps de contenido', items: report.gap_analysis.content_gaps, color: '#06b6d4' },
            { label: 'Gaps de posicionamiento', items: report.gap_analysis.positioning_gaps, color: '#4ade80' },
          ].map(({ label, items, color }) => (
            <div key={label}>
              <p style={{ fontWeight: 600, marginBottom: 8, color }}>{label}</p>
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((item, i) => <li key={i} style={{ fontSize: 14, color: 'var(--text-dim)' }}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => router.push('/dashboard')} className="btn btn-primary" style={{ width: '100%' }}>
        Ver mi estrategia de contenido
      </button>
    </div>
  )
}

function CompetitorCard({ competitor }: { competitor: AnalyzedCompetitor }) {
  const [expanded, setExpanded] = useState(false)
  const threatColor = { low: '#4ade80', medium: '#fbbf24', high: '#f87171' }[competitor.threat_level]

  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>{competitor.name}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{competitor.value_proposition.positioning}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>{competitor.overall_score}<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/10</span></div>
          <div style={{ fontSize: 12, color: threatColor, fontWeight: 600 }}>Amenaza {competitor.threat_level === 'high' ? 'alta' : competitor.threat_level === 'medium' ? 'media' : 'baja'}</div>
        </div>
      </div>

      {/* Data sources */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {competitor.sources_succeeded.map(s => (
          <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>✓ {s}</span>
        ))}
        {competitor.sources_failed.map(s => (
          <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>✗ {s}</span>
        ))}
      </div>

      <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
        {expanded ? 'Ver menos ↑' : 'Ver análisis completo ↓'}
      </button>

      {expanded && (
        <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          {competitor.google_reviews && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Google Reviews</p>
              <p style={{ fontWeight: 600 }}>⭐ {competitor.google_reviews.rating} ({competitor.google_reviews.total_reviews} reseñas)</p>
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, color: '#4ade80', marginBottom: 6, fontWeight: 600 }}>Fortalezas</p>
            <ul style={{ paddingLeft: 16 }}>{competitor.strengths.map((s, i) => <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>{s}</li>)}</ul>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#f87171', marginBottom: 6, fontWeight: 600 }}>Debilidades</p>
            <ul style={{ paddingLeft: 16 }}>{competitor.weaknesses.map((s, i) => <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>{s}</li>)}</ul>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#a855f7', marginBottom: 6, fontWeight: 600 }}>Oportunidades para vos</p>
            <ul style={{ paddingLeft: 16 }}>{competitor.opportunities_for_client.map((s, i) => <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>{s}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/competitor/
git commit -m "feat: add competitor report page with loading + full report UI"
```

---

## Task 13: Add /competitor to proxy skip list

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Update the skip list in proxy.ts**

Find this line in `proxy.ts`:
```typescript
if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/intake') && !pathname.startsWith('/settings')) {
```

Replace with:
```typescript
if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/intake') && !pathname.startsWith('/settings') && !pathname.startsWith('/competitor')) {
```

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat: add /competitor to proxy skip list"
```

---

## Task 14: Add spin animation to global CSS

**Files:**
- Modify: `app/globals.css` (or wherever global styles live)

- [ ] **Step 1: Find globals.css**

```bash
ls app/globals.css 2>/dev/null || ls app/global.css 2>/dev/null || find app -name "*.css" | head -5
```

- [ ] **Step 2: Add spin keyframe**

Add to the end of the CSS file:
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add spin keyframe animation for loading states"
```

---

## Task 15: Add env vars to Vercel

- [ ] **Step 1: Add env vars in Vercel dashboard**

Go to Vercel → Project → Settings → Environment Variables. Add:

```
GOOGLE_PLACES_API_KEY = (your key, or leave empty for now)
APIFY_API_TOKEN = (your token, or leave empty for now)
NEXT_PUBLIC_SITE_URL = https://your-vercel-domain.vercel.app
```

`GOOGLE_PLACES_API_KEY`: Get at console.cloud.google.com → Enable "Places API" → Create API key
`APIFY_API_TOKEN`: Get at apify.com → free account → Settings → API tokens
`NEXT_PUBLIC_SITE_URL`: Your Vercel production URL

**The agent works without both keys** — it will scrape websites and use Claude's general knowledge for competitors, skipping Google Reviews and Instagram.

- [ ] **Step 2: Add to local .env.local for development**

```bash
# .env.local (add these lines, they're already gitignored)
# GOOGLE_PLACES_API_KEY=
# APIFY_API_TOKEN=
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Commit (just the env.local comment, not values)**

```bash
git add .env.local.example 2>/dev/null || true
git commit -m "infra: document required env vars for Agent 2"
```

---

## Task 16: Full deploy and smoke test

- [ ] **Step 1: Push all changes**

```bash
git push origin main
```

- [ ] **Step 2: Promote to Production in Vercel**

Vercel → Deployments → latest deployment → `···` → Promote to Production

- [ ] **Step 3: Smoke test the API directly**

First get a `session_id` and `business_brief` from a completed intake session in Supabase:
- Supabase → Table Editor → `intake_sessions` → filter `status = 'complete'` → copy `id` and `business_brief`

Then test:
```bash
curl -X POST https://your-domain.vercel.app/api/agents/competitor/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: (paste your auth cookie from browser DevTools)" \
  -d '{"session_id":"<id>","business_brief":<paste brief json>}' \
  | jq .
```

Expected: `{"analysis_id":"...","status":"completed"}`

- [ ] **Step 4: Test full flow end-to-end**

1. Go to `/intake` → complete intake with 1-2 competitors
2. After final message → should redirect to `/competitor/[id]`
3. Loading screen should appear
4. After 30-90 seconds → report should render with strengths/weaknesses/recommendations

---

## Self-Review

**Spec coverage:**
- ✅ POST analyze endpoint
- ✅ GET polling endpoint
- ✅ Website scraping (cheerio)
- ✅ Google Reviews (Places API)
- ✅ Instagram via Apify (optional, gated)
- ✅ Claude individual + cross analysis
- ✅ DB schema
- ✅ Error handling / fallbacks per source
- ✅ Rate limiting (sequential, not parallel)
- ✅ UI for report display
- ✅ Auto-trigger from Agent 1 completion
- ✅ Env vars documented
- ❌ Facebook/TikTok — intentionally omitted (see evaluation notes)
- ❌ Redis caching — intentionally omitted (DB field approach)
- ❌ WebSockets — replaced with polling

**Omissions from original spec (intentional):**
- Puppeteer → replaced with fetch+cheerio (works in serverless)
- Redis → not needed at this scale
- WebSockets → Supabase Realtime polling is simpler
- Meta Ad Library → too complex for MVP
- Auto-discovery via Google → omitted, user provides competitors
- Event bus → direct API call is simpler
