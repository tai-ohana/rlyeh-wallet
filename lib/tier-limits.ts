import type { UserTier, Profile } from './types'

// Tier limits configuration
// Infinity = unlimited for that tier
export const TIER_LIMITS = {
  free: {
    maxImages: 5,
    maxImageSize: 1200, // px
    maxLinks: 5,
    maxImpressionLength: 500,
    maxFollowing: 100,
    maxFriends: 50,
    maxTagsPerReport: 1, // Free: 1 tag per report
    canExportData: false,
    canUseCustomTags: false,
    canUseFolders: false,
    canUseCustomUrl: false,
    canUseHeaderImage: false,
    canUseMiniCharacter: false,
    canUseCustomTheme: false,
    canAcceptViewerComments: false,
    canAcceptFusetter: false,
    canBeFollowed: false, // Only streamers can be followed
    hasProBadge: false,
    hasStreamerBadge: false,
    // Matching features — 全ユーザーに開放（データ収集のため）
    canUseMatching: true,
    canHideAds: false,
    maxScenarioPreferences: 5, // free: 各5件まで
    // Pro Plan: Advanced features
    canUseMarkdownMemo: false,
    canUsePrivateNotes: false,
    // Streamer Plan: Features
    canUseYouTubeEmbed: false,
    canDistributeAds: false,
  },
  pro: {
    maxImages: Infinity, // Pro: unlimited images
    maxImageSize: 2400, // px
    maxLinks: Infinity, // Pro: unlimited links
    maxImpressionLength: Infinity, // Pro: unlimited text
    maxFollowing: Infinity, // Pro: unlimited following
    maxFriends: Infinity, // Pro: unlimited friends
    maxTagsPerReport: 5, // Pro+: 5 tags per report
    canExportData: true,
    canUseCustomTags: true,
    canUseFolders: true,
    canUseCustomUrl: false,
    canUseHeaderImage: false,
    canUseMiniCharacter: false,
    canUseCustomTheme: false,
    canAcceptViewerComments: false,
    canAcceptFusetter: false,
    canBeFollowed: false,
    hasProBadge: true,
    hasStreamerBadge: false,
    // Matching features
    canUseMatching: true,
    canHideAds: true,
    maxScenarioPreferences: 30, // pro: 各30件まで
    // Pro Plan: Advanced features
    canUseMarkdownMemo: true,
    canUsePrivateNotes: true,
    // Streamer Plan: Features
    canUseYouTubeEmbed: false,
    canDistributeAds: false,
  },
  streamer: {
    maxImages: Infinity, // Streamer: unlimited images
    maxImageSize: Infinity, // Streamer: original size
    maxLinks: Infinity, // Streamer: unlimited links
    maxImpressionLength: Infinity, // Streamer: unlimited text
    maxFollowing: Infinity, // Streamer: unlimited following
    maxFriends: Infinity, // Streamer: unlimited friends
    maxTagsPerReport: 5, // Streamer: 5 tags per report
    canExportData: true,
    canUseCustomTags: true,
    canUseFolders: true,
    canUseCustomUrl: true,
    canUseHeaderImage: true,
    canUseMiniCharacter: true,
    canUseCustomTheme: true,
    canAcceptViewerComments: true,
    canAcceptFusetter: true,
    canBeFollowed: true,
    hasProBadge: true,
    hasStreamerBadge: true,
    // Matching features (inherited)
    canUseMatching: true,
    canHideAds: true,
    maxScenarioPreferences: 30, // streamer: 各30件まで
    // Pro Plan: Advanced features (inherited)
    canUseMarkdownMemo: true,
    canUsePrivateNotes: true,
    // Streamer Plan: Features
    canUseYouTubeEmbed: true,
    canDistributeAds: true,
  },
} as const

export type TierLimits = typeof TIER_LIMITS[UserTier]

// Get limits for a given tier
export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier]
}

// Get limits for a profile (handles null/undefined tier)
export function getProfileLimits(profile: Profile | null | undefined): TierLimits {
  const tier = profile?.tier || 'free'
  return TIER_LIMITS[tier]
}

// Check if user has reached a specific limit
export function hasReachedLimit(
  profile: Profile | null | undefined,
  limitKey: keyof TierLimits,
  currentValue: number
): boolean {
  const limits = getProfileLimits(profile)
  const limit = limits[limitKey]

  if (typeof limit === 'number') {
    return currentValue >= limit
  }

  return false
}

// Check if user can use a feature
export function canUseFeature(
  profile: Profile | null | undefined,
  featureKey: keyof TierLimits
): boolean {
  const limits = getProfileLimits(profile)
  const feature = limits[featureKey]

  return feature === true
}

// Get remaining count for a limit
export function getRemainingCount(
  profile: Profile | null | undefined,
  limitKey: keyof TierLimits,
  currentValue: number
): number {
  const limits = getProfileLimits(profile)
  const limit = limits[limitKey]

  if (typeof limit === 'number') {
    return Math.max(0, limit - currentValue)
  }

  return 0
}

// Tier display names
export const TIER_DISPLAY_NAMES: Record<UserTier, string> = {
  free: '無料',
  pro: 'Pro',
  streamer: '配信者',
}

// Tier pricing (JPY)
// pro = 買い切り、streamer = 準備中
export const TIER_PRICING: Record<UserTier, number> = {
  free: 0,
  pro: 980,       // 買い切り（ローンチ割引価格）
  streamer: 0,    // 準備中（未販売）
}

export const TIER_IS_ONE_TIME: Record<UserTier, boolean> = {
  free: false,
  pro: true,      // 買い切り
  streamer: false, // TBD
}

export const TIER_AVAILABLE: Record<UserTier, boolean> = {
  free: true,
  pro: true,
  streamer: false, // 準備中
}

// Check if tier is active (not expired)
export function isTierActive(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  if (profile.tier === 'free') return true

  if (profile.tier_expires_at) {
    return new Date(profile.tier_expires_at) > new Date()
  }

  return true
}

// Get effective tier (considering expiration)
export function getEffectiveTier(profile: Profile | null | undefined): UserTier {
  if (!profile) return 'free'

  if (!isTierActive(profile)) {
    return 'free'
  }

  return profile.tier || 'free'
}

// Tier badge colors
export const TIER_BADGE_COLORS: Record<UserTier, { bg: string; text: string; border: string }> = {
  free: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  pro: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
  },
  streamer: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/30',
  },
}

// Former tier grey badge colors (for downgraded users)
export const FORMER_TIER_BADGE_COLORS: Record<'pro' | 'streamer', { bg: string; text: string; border: string }> = {
  pro: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  streamer: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
}

// Former tier display names
export const FORMER_TIER_DISPLAY_NAMES: Record<'pro' | 'streamer', string> = {
  pro: '元Pro',
  streamer: '元配信者',
}
