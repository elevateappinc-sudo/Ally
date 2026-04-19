export interface Brand {
  id: string
  name: string
  description?: string
  logo_url?: string
  color: string
  industry?: string
  website?: string
  user_id: string
  created_at: string
  updated_at: string
}

export type Platform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin'
export type ContentFormat = 'post' | 'story' | 'reel' | 'short' | 'video' | 'ad' | 'carousel'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type PostStatus = 'pending' | 'scheduled' | 'published' | 'failed'
export type MediaType = 'image' | 'video'

export interface TrendResult {
  keyword: string
  interest: { date: string; value: number }[]
  relatedQueries: { query: string; value: number }[]
  risingQueries: { query: string; value: string }[]
  redditPosts: { title: string; subreddit: string; score: number; url: string }[]
  hashtags: string[]
  contentIdeas: string[]
  insight: string
}

export interface Campaign {
  id: string
  user_id: string
  brand_id?: string
  name: string
  objective: string
  product: string
  audience: string
  tone: string
  budget?: number
  platforms: Platform[]
  start_date: string
  end_date: string
  status: CampaignStatus
  is_paid: boolean
  created_at: string
  updated_at: string
}
