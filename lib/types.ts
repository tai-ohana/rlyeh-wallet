// R'lyeh Wallet Types

// ─── Scenario DB ──────────────────────────────────────────────────
export interface ScenarioStats {
  scenario_name: string
  scenario_author: string | null
  total_sessions: number
  unique_reporters: number
  avg_duration: number | null
  total_duration: number
  success_rate: number | null
  first_played_at: string | null
  last_played_at: string | null
  cover_image_url: string | null
}

export interface ScenarioKpStat {
  scenario_name: string
  username: string
  display_name: string | null
  avatar_url: string | null
  run_count: number
  last_run_at: string | null
}

// ─── Investigator (探索者) ────────────────────────────────────────
export type InvestigatorStatus = 'active' | 'lost' | 'retired'

export interface Investigator {
  id: string
  user_id: string
  name: string
  occupation: string | null
  age: string | null
  avatar_url: string | null
  backstory: string | null
  status: InvestigatorStatus
  tags: string[]
  san_current: number | null
  san_max: number | null
  hp_max: number | null
  mp_max: number | null
  cocofolia_data: Record<string, unknown> | null
  display_order: number
  created_at: string
  updated_at: string
  // Joined
  sessions?: InvestigatorSession[]
  session_count?: number
}

export interface InvestigatorSession {
  id: string
  investigator_id: string
  play_report_id: string
  result: 'survive' | 'lost' | 'other' | null
  notes: string | null
  created_at: string
  // Joined
  play_report?: {
    id: string
    scenario_name: string
    play_date_start: string
    cover_image_url: string | null
  }
}

// Cocofolia JSON paste format
export interface CocofolicaCharacter {
  kind: 'character'
  name: string
  initiative?: number
  imageUrl?: string
  status?: Array<{ label: string; value: number; max?: number }>
  params?: Array<{ label: string; value: number }>
  commands?: string
}

export type UserTier = 'free' | 'pro' | 'streamer'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  privacy_setting: 'public' | 'followers' | 'private'
  is_pro: boolean
  is_streamer: boolean
  tier: UserTier
  tier_started_at: string | null
  tier_expires_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  custom_url_slug: string | null
  header_image_url: string | null
  mini_character_url: string | null
  custom_theme: Record<string, string> | null
  accept_viewer_comments: boolean
  accept_fusetter: boolean
  require_mention_approval: boolean
  twitter_id: string | null
  role_preference: 'pl_main' | 'gm_main' | 'both' | null
  favorite_report_ids: string[]
  scenario_tags: string[]
  play_style_tags: string[]
  play_style_other: string | null
  former_tier: 'pro' | 'streamer' | null
  created_at: string
  updated_at: string
}

export interface PlayReport {
  id: string
  user_id: string
  scenario_name: string
  scenario_author: string | null
  edition: string | null
  cover_image_url: string | null
  play_date_start: string
  play_date_end: string | null
  play_duration: number | null
  result: 'success' | 'failure' | 'other' | null
  end_type: 'clear' | 'bad_end' | 'dead' | 'ongoing' | null
  end_description: string | null
  impression: string | null
  share_code: string | null
  privacy_setting: 'public' | 'followers' | 'private'
  twitter_post_url: string | null
  private_notes: string | null
  is_mini: boolean
  is_favorite: boolean
  folder_id: string | null
  folder_sort_order: number
  created_at: string
  updated_at: string
  // Joined data
  profile?: Profile
  participants?: PlayReportParticipant[]
  links?: PlayReportLink[]
  images?: PlayReportImage[]
  likes?: Like[]
  likes_count?: number
  user_has_liked?: boolean
  tags?: ReportTag[]
}

export interface PlayReportParticipant {
  id: string
  play_report_id: string
  user_id: string | null
  username: string
  role: 'KP' | 'PL'
  character_name: string | null
  handout: string | null
  result: 'survive' | 'dead' | 'insane' | 'other' | null
  created_at: string
  // Joined data
  profile?: Profile
}

export interface PlayReportLink {
  id: string
  play_report_id: string
  link_type: 'scenario' | 'replay' | 'character_sheet' | 'other'
  url: string
  title: string | null
  created_at: string
}

export interface PlayReportImage {
  id: string
  play_report_id: string
  image_url: string
  image_type: 'cover' | 'character' | 'scene' | 'other' | null
  sort_order: number
  created_at: string
}

export interface Like {
  id: string
  play_report_id: string
  user_id: string
  created_at: string
  // Joined data
  profile?: Profile
}

export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Joined data
  from_user?: Profile
  to_user?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: 'mention' | 'share_code' | 'follow' | 'like' | 'friend_request' | 'system'
  from_user_id: string | null
  play_report_id: string | null
  is_read: boolean
  created_at: string
  // Joined data
  from_user?: Profile
  play_report?: PlayReport
}

export interface NotificationSettings {
  user_id: string
  mention_notification: boolean
  share_code_notification: boolean
  follow_notification: boolean
  like_notification: boolean
  email_weekly_summary: boolean
  created_at: string
  updated_at: string
}

// Form types
export interface PlayReportFormData {
  scenario_name: string
  scenario_author: string
  edition: string
  play_date_start: string
  play_date_end: string
  play_duration: number | null
  result: PlayReport['result']
  end_type: PlayReport['end_type']
  impression: string
  privacy_setting: PlayReport['privacy_setting']
  participants: Omit<PlayReportParticipant, 'id' | 'play_report_id' | 'created_at'>[]
  links: Omit<PlayReportLink, 'id' | 'play_report_id' | 'created_at'>[]
}

// Stats types
export interface UserStats {
  total_sessions: number
  total_as_kp: number
  total_as_pl: number
  scenarios_played: number
  survival_rate: number
  most_played_scenario: string | null
  play_duration_total: number
}

// Tier-related types
export interface CustomTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface CustomFolder {
  id: string
  user_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface ReportFolder {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_report_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // Computed/joined data
  reports?: PlayReport[]
  report_count?: number
  total_likes?: number
  total_duration?: number
  cover_image_url?: string | null
  kp_info?: {
    username: string
    avatar_url: string | null
  } | null
}

export interface ViewerComment {
  id: string
  play_report_id: string
  user_id: string | null
  author_name: string | null
  content: string
  is_approved: boolean
  created_at: string
  // Joined data
  profile?: Profile
}

export interface YouTubeLink {
  id: string
  play_report_id: string
  youtube_url: string
  title: string | null
  thumbnail_url: string | null
  link_type: 'main' | 'clip' | 'playlist'
  sort_order: number
  created_at: string
}

export interface ReportTag {
  id: string
  play_report_id: string
  tag_name: string
  sort_order?: number
  created_at: string
}

// =============================================
// Pro Plan: Matching Feature Types
// =============================================

export type ScenarioPreferenceType = 'want_to_play' | 'can_run'

export interface ScenarioPreference {
  id: string
  user_id: string
  scenario_name: string
  scenario_author: string | null
  preference_type: ScenarioPreferenceType
  created_at: string
}

// =============================================
// Streamer Plan: Ad Feature Types
// =============================================

export interface UserAdPreferences {
  user_id: string
  hide_streamer_ads: boolean
  created_at: string
  updated_at: string
}

export interface StreamerAdImpression {
  id: string
  play_report_id: string
  viewer_user_id: string | null
  impression_type: 'view' | 'click' | 'dismiss'
  created_at: string
}

// Streamer ad card display data
export interface StreamerAdCard {
  report: PlayReport
  streamer: Profile
}

