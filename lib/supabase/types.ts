export type Role = 'owner' | 'editor' | 'viewer'
export type PostType = 'carousel' | 'reel' | 'story' | 'static'
export type Pillar = 'education' | 'behind_scenes' | 'social_proof' | 'sales'
export type PostStatus = 'pending' | 'approved' | 'skipped' | 'published'

export interface Organization {
  id: string; name: string; slug: string; is_active: boolean; created_at: string
}
export interface OrgMember {
  id: string; org_id: string; user_id: string; role: Role; created_at: string
}
export interface OrgInvitation {
  id: string; org_id: string; invited_email: string; role: Role
  token: string; expires_at: string; created_by: string; created_at: string
}
export interface OnboardingData {
  id: string; org_id: string; created_by: string
  business: string; pain_point: string; social_url: string | null
  time_commitment: string; created_at: string
}
export interface MarketingStrategy {
  id: string; org_id: string; onboarding_id: string
  pillars: Record<Pillar, number>; frequency: string
  platforms: string[]; reasoning: string | null; created_at: string
}
export interface ContentPost {
  id: string; org_id: string; strategy_id: string
  post_date: string; post_type: PostType; pillar: Pillar
  caption: string; visual_brief: string; hashtags: string[] | null
  best_time: string | null; status: PostStatus
  approved_by: string | null; created_at: string
}
export interface AdminUser { user_id: string; created_at: string }

export interface ProductsServicesBasic {
  input_method: 'document' | 'website' | 'voice_description' | 'skipped'
  source?: {
    type: 'pdf' | 'image' | 'website'
    url?: string
  }
  categories: string[]
  signature_items: string[]
  special_attributes: string[]
  observations: string
  detailed_catalog_completed: boolean
}

export interface InventoryExtraction {
  categories: string[]
  signature_items: string[]
  special_attributes: string[]
  observations: string
}
