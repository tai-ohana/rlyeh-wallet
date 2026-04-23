import React from "react"
import { createClient } from '@/lib/supabase/server'
import { DashboardFeed } from '@/components/dashboard-feed'
import { MatchingRecommendations } from '@/components/matching-recommendations'
import { StreamerAdCard } from '@/components/streamer-ad-card'
import { XShareButton } from '@/components/x-share-button'
import { TrendingScenarios } from '@/components/trending-scenarios'
import {
  WelcomeHeader,
  MilestoneBanner,
  RoleStats,
  ActiveFriends,
  SuggestedUsers,
  InvestigatorRank,
  MythosTip,
} from '@/components/dashboard-widgets'
import { HeroReportCard, HeroReportCardEmpty } from '@/components/hero-report-card'
import { WalletPurchaseCTA, WalletOwnerBadge } from '@/components/wallet-cta'
import type { SuggestedUser } from '@/components/dashboard-widgets'
import { getProfileLimits, canUseFeature } from '@/lib/tier-limits'
import type { PlayReport, Profile, ScenarioPreference } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const limits = getProfileLimits(profile)
  const canUseMatching = canUseFeature(profile, 'canUseMatching')
  const canHideAds = canUseFeature(profile, 'canHideAds')

  // Get user's ad preferences
  let hideStreamerAds = false
  if (canHideAds) {
    const { data: adPrefs } = await supabase
      .from('user_ad_preferences')
      .select('hide_streamer_ads')
      .eq('user_id', user.id)
      .single()
    hideStreamerAds = adPrefs?.hide_streamer_ads || false
  }

  // Get user's play history for recommendations AND statistics
  const { data: userReports } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author, created_at')
    .eq('user_id', user.id)

  // Latest own report — used as the "hero" card at the top of the feed
  const { data: heroReportData } = await supabase
    .from('play_reports')
    .select(`
      *,
      profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
      participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
      likes:likes(id)
    `)
    .eq('user_id', user.id)
    .eq('is_mini', false)
    .order('play_date_start', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const heroReport: PlayReport | null = heroReportData
    ? ({ ...heroReportData, likes_count: heroReportData.likes?.length || 0 } as PlayReport)
    : null

  const playedScenarios = new Set(userReports?.map(r => r.scenario_name) || [])
  const playedAuthors = new Set(userReports?.map(r => r.scenario_author).filter(Boolean) || [])

  // Statistics calculations
  const totalReports = userReports?.length || 0
  const uniqueScenarios = playedScenarios.size
  const uniqueAuthors = playedAuthors.size

  // This month's reports
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthReports = userReports?.filter(r =>
    new Date(r.created_at) >= thisMonthStart
  ).length || 0

  // =============================================
  // Weekly streak (consecutive weeks with at least 1 report)
  // =============================================
  let streak = 0
  for (let w = 0; w < 52; w++) {
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)
    const hasActivity = userReports?.some(r => {
      const d = new Date(r.created_at)
      return d >= weekStart && d < weekEnd
    })
    if (hasActivity) {
      streak++
    } else {
      break
    }
  }

  // =============================================
  // Survival rate for SAN値 calculation
  // =============================================
  const { data: userParticipants } = await supabase
    .from('play_report_participants')
    .select('role, result, user_id')
    .eq('user_id', user.id)

  let plSessions = 0
  let surviveCount = 0
  let kpSessions = 0
  userParticipants?.forEach(p => {
    if (p.role === 'PL') {
      if (p.result === 'survive' || p.result === 'dead' || p.result === 'insane') {
        plSessions++
        if (p.result === 'survive') surviveCount++
      }
    } else if (p.role === 'KP') {
      kpSessions++
    }
  })
  const survivalRate = plSessions > 0 ? Math.round((surviveCount / plSessions) * 100) : 100

  // SAN値: Based on survival rate and activity — fun gamification
  // Higher survival rate = higher SAN, active play keeps it up
  const baseSan = survivalRate
  const activityBonus = Math.min(thisMonthReports * 3, 15) // up to +15 for being active
  const sanity = Math.max(1, Math.min(99, baseSan + activityBonus - (plSessions === 0 ? 30 : 0)))

  // Get friends (mutual follows)
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', user.id)

  const followingIds = following?.map(f => f.following_id) || []
  const followerIds = followers?.map(f => f.follower_id) || []

  // Mutual friends
  const friendIds = followingIds.filter(id => followerIds.includes(id))

  // =============================================
  // Active friends — recent activity
  // =============================================
  let activeFriends: { profile: Profile; lastActive: string; recentScenario?: string }[] = []
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds.slice(0, 20))

    // Get most recent report from each friend
    const { data: friendRecentReports } = await supabase
      .from('play_reports')
      .select('user_id, scenario_name, created_at')
      .in('user_id', friendIds.slice(0, 20))
      .order('created_at', { ascending: false })
      .limit(50)

    const friendLatestMap = new Map<string, { scenario: string; date: string }>()
    friendRecentReports?.forEach(r => {
      if (!friendLatestMap.has(r.user_id)) {
        friendLatestMap.set(r.user_id, { scenario: r.scenario_name, date: r.created_at })
      }
    })

    activeFriends = (friendProfiles || [])
      .map(fp => ({
        profile: fp as Profile,
        lastActive: friendLatestMap.get(fp.id)?.date || fp.updated_at,
        recentScenario: friendLatestMap.get(fp.id)?.scenario,
      }))
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 5)
  }

  // =============================================
  // Suggested Users
  // =============================================
  const suggestedUsers: SuggestedUser[] = []
  const suggestedUserIds = new Set<string>([user.id, ...followingIds]) // 自分とフォロー済みは除外

  // 1. 友達の友達（friend of friend）
  let fofProfiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }[] = []
  if (friendIds.length > 0) {
    const { data: fofFollowing } = await supabase
      .from('follows')
      .select('following_id')
      .in('follower_id', friendIds)
      .not('following_id', 'in', `(${[user.id, ...followingIds].join(',')})`)

    const fofIds = [...new Set((fofFollowing || []).map(f => f.following_id))]

    if (fofIds.length > 0) {
      const { data: fofData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', fofIds)
        .limit(3)

      fofProfiles = fofData || []
      for (const p of fofProfiles) {
        if (!suggestedUserIds.has(p.id)) {
          suggestedUsers.push({ profile: p as any, reason: 'friend_of_friend' })
          suggestedUserIds.add(p.id)
        }
      }
    }
  }

  // 2. 同じシナリオを遊んだユーザー
  if (playedScenarios.size > 0) {
    const scenarioList = [...playedScenarios].slice(0, 5)
    const { data: sameScenarioReports } = await supabase
      .from('play_reports')
      .select('user_id, scenario_name')
      .in('scenario_name', scenarioList)
      .eq('privacy_setting', 'public')
      .neq('user_id', user.id)
      .limit(30)

    // ユーザーごとに最初のシナリオ名を記録
    const scenarioByUser = new Map<string, string>()
    for (const r of (sameScenarioReports || [])) {
      if (!scenarioByUser.has(r.user_id)) scenarioByUser.set(r.user_id, r.scenario_name)
    }

    const candidateIds = [...scenarioByUser.keys()].filter(id => !suggestedUserIds.has(id)).slice(0, 5)
    if (candidateIds.length > 0) {
      const { data: candidateProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', candidateIds)
        .limit(3)

      for (const p of (candidateProfiles || [])) {
        if (!suggestedUserIds.has(p.id) && suggestedUsers.length < 5) {
          suggestedUsers.push({
            profile: p as any,
            reason: 'same_scenario',
            reasonDetail: scenarioByUser.get(p.id),
          })
          suggestedUserIds.add(p.id)
        }
      }
    }
  }

  // 3. アクティブなKP（まだ足りない場合）
  if (suggestedUsers.length < 5) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activeKpReports } = await supabase
      .from('play_reports')
      .select('user_id')
      .eq('privacy_setting', 'public')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(50)

    // KP参加者から絞り込み
    const { data: kpParticipants } = await supabase
      .from('play_report_participants')
      .select('user_id')
      .eq('role', 'KP')
      .in('user_id', [...new Set((activeKpReports || []).map(r => r.user_id))])
      .limit(20)

    const activeKpIds = [...new Set((kpParticipants || []).map(p => p.user_id))]
      .filter(id => !suggestedUserIds.has(id))
      .slice(0, 3)

    if (activeKpIds.length > 0) {
      const { data: kpProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', activeKpIds)
        .limit(5 - suggestedUsers.length)

      for (const p of (kpProfiles || [])) {
        if (!suggestedUserIds.has(p.id) && suggestedUsers.length < 5) {
          suggestedUsers.push({ profile: p as any, reason: 'active_kp' })
          suggestedUserIds.add(p.id)
        }
      }
    }
  }

  // Get friends of friends for recommendations
  let friendsOfFriendIds: string[] = []
  if (friendIds.length > 0) {
    const { data: fofData } = await supabase
      .from('follows')
      .select('following_id')
      .in('follower_id', friendIds)
      .not('following_id', 'eq', user.id)

    friendsOfFriendIds = fofData?.map(f => f.following_id).filter(id => !friendIds.includes(id)) || []
  }

  // =============================================
  // Trending Scenarios (this month)
  // =============================================
  const currentDay = now.getDate()
  const isMeasuring = currentDay <= 3

  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: trendingData } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author')
    .eq('privacy_setting', 'public')
    .eq('is_mini', false)
    .gte('play_date_start', thisMonthStr)

  // Count scenario popularity
  const scenarioCounts = new Map<string, { name: string; author: string | null; count: number }>()
  for (const report of (trendingData || [])) {
    const key = report.scenario_name
    const existing = scenarioCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      scenarioCounts.set(key, {
        name: report.scenario_name,
        author: report.scenario_author,
        count: 1,
      })
    }
  }

  // Sort by count and take top 5
  const trendingScenarios = Array.from(scenarioCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s, i) => ({
      ...s,
      trend: i === 0 ? 'up' as const : s.count >= 3 ? 'up' as const : 'stable' as const,
    }))

  // =============================================
  // Pro Feature: Matching Recommendations
  // =============================================
  let kpReports: PlayReport[] = []
  let interestedPlayers: { profile: Profile; scenarioName: string }[] = []
  let scenarioPreferences: ScenarioPreference[] = []

  if (canUseMatching) {
    // Get user's scenario preferences
    const { data: prefs } = await supabase
      .from('scenario_preferences')
      .select('*')
      .eq('user_id', user.id)

    scenarioPreferences = prefs || []

    const wantToPlay = scenarioPreferences.filter(p => p.preference_type === 'want_to_play')
    const canRun = scenarioPreferences.filter(p => p.preference_type === 'can_run')

    // Get KP reports for "want to play" scenarios
    if (wantToPlay.length > 0) {
      const scenarioNames = wantToPlay.map(p => p.scenario_name)

      const { data: kpData } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
          participants:play_report_participants(role, user_id)
        `)
        .in('scenario_name', scenarioNames)
        .eq('privacy_setting', 'public')
        .eq('is_mini', false)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Filter to only KP reports
      kpReports = (kpData || []).filter(report =>
        report.participants?.some((p: any) => p.role === 'KP' && p.user_id === report.user_id)
      )
    }

    // Get interested players for "can run" scenarios
    if (canRun.length > 0) {
      const scenarioNames = canRun.map(p => p.scenario_name)

      const { data: playerPrefs } = await supabase
        .from('scenario_preferences')
        .select(`
          scenario_name,
          profile:profiles!scenario_preferences_user_id_fkey(*)
        `)
        .in('scenario_name', scenarioNames)
        .eq('preference_type', 'want_to_play')
        .neq('user_id', user.id)
        .limit(10)

      interestedPlayers = (playerPrefs || []).map(p => ({
        profile: p.profile as unknown as Profile,
        scenarioName: p.scenario_name,
      })).filter(p => p.profile)
    }
  }

  // =============================================
  // Streamer Ads (for non-Pro users)
  // =============================================
  let streamerAds: { report: PlayReport; streamer: Profile }[] = []

  if (!hideStreamerAds) {
    // Get random streamer reports from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: streamerReports } = await supabase
      .from('play_reports')
      .select(`
        *,
        profile:profiles!play_reports_user_id_fkey(*)
      `)
      .eq('privacy_setting', 'public')
      .eq('is_mini', false)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('user_id', user.id)
      .limit(20)

    // Filter to streamer reports and shuffle
    const streamerOnlyReports = (streamerReports || [])
      .filter(r => (r.profile as any)?.tier === 'streamer')

    // Random shuffle and take 2
    const shuffled = streamerOnlyReports.sort(() => Math.random() - 0.5)
    streamerAds = shuffled.slice(0, 2).map(r => ({
      report: r as PlayReport,
      streamer: r.profile as unknown as Profile,
    }))
  }

  // Recommendation scoring on recent public reports
  let recommendedReports: any[] = []

  const { data: recentPublicReports } = await supabase
    .from('play_reports')
    .select(`
      *,
      profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
      participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
      likes:likes(id)
    `)
    .eq('privacy_setting', 'public')
    .eq('is_mini', false)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (recentPublicReports) {
    const scoredReports = recentPublicReports.map(report => {
      let score = 0

      // +3 if from a friend of friend
      if (friendsOfFriendIds.includes(report.user_id)) score += 3

      // +2 if author user has played before
      if (report.scenario_author && playedAuthors.has(report.scenario_author)) score += 2

      // +0.5 per like
      score += (report.likes?.length || 0) * 0.5

      // +1 if recent (within last 7 days)
      const daysSinceCreated = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 1

      // -5 if user already played this scenario
      if (playedScenarios.has(report.scenario_name)) score -= 5

      return { ...report, _score: score, likes_count: report.likes?.length || 0 }
    })

    // Sort by score and take top 20 for random insertion into feed
    recommendedReports = scoredReports
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
  }

  // Get friends' recent reports (first page)
  let friendsReports: any[] = []
  if (friendIds.length > 0) {
    const { data } = await supabase
      .from('play_reports')
      .select(`
        *,
        profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
        participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
        likes:likes(id)
      `)
      .in('user_id', friendIds)
      .in('privacy_setting', ['public', 'followers'])
      .eq('is_mini', false)
      .order('play_date_start', { ascending: false })
      .limit(10)

    friendsReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
  }

  // Get streamers user follows (non-mutual follows to streamers)
  const nonMutualFollowingIds = followingIds.filter(id => !followerIds.includes(id))

  let streamerIds: string[] = []
  let followingReports: any[] = []

  if (nonMutualFollowingIds.length > 0) {
    const { data: streamerProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', nonMutualFollowingIds)
      .eq('tier', 'streamer')

    streamerIds = streamerProfiles?.map(p => p.id) || []

    if (streamerIds.length > 0) {
      const { data } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url, tier),
          participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
          likes:likes(id)
        `)
        .in('user_id', streamerIds)
        .eq('privacy_setting', 'public')
        .eq('is_mini', false)
        .order('play_date_start', { ascending: false })
        .limit(10)

      followingReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
    }
  }

  return (
    <>
      {/* Main Feed Area - centered in the space between left and right sidebars */}
      <div className="-my-6 min-h-screen max-w-[600px] mx-auto border-x border-border/40">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-strong border-b border-border/40 px-5 py-3.5">
          <h1 className="text-xl font-bold tracking-tight">ホーム</h1>
        </div>

        {/* Welcome Header — greeting + quick stats */}
        <WelcomeHeader
          displayName={profile?.display_name || profile?.username || '探索者'}
          totalReports={totalReports}
          thisMonthReports={thisMonthReports}
          streak={streak}
          sanity={sanity}
        />

        {/* Hero: latest own report as a prized card */}
        {heroReport ? (
          <HeroReportCard report={heroReport} />
        ) : (
          <HeroReportCardEmpty />
        )}

        {/* Milestone celebration banner */}
        <MilestoneBanner totalReports={totalReports} />

        {/* Streamer Ads (for non-hiding users) - inline */}
        {streamerAds.length > 0 && (
          <div className="p-4 border-b border-border/40">
            {streamerAds.slice(0, 1).map((ad) => (
              <StreamerAdCard
                key={ad.report.id}
                report={ad.report}
                streamer={ad.streamer}
                canHideAds={canHideAds}
              />
            ))}
          </div>
        )}

        {/* Pro Feature: Matching Recommendations - compact inline */}
        {canUseMatching && (kpReports.length > 0 || interestedPlayers.length > 0) && (
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">マッチング</h2>
              <XShareButton preferences={scenarioPreferences} size="sm" />
            </div>
            <MatchingRecommendations
              kpReports={kpReports}
              interestedPlayers={interestedPlayers}
            />
          </div>
        )}

        {/* Main Feed */}
        <DashboardFeed
          initialFriendReports={friendsReports}
          initialFollowingReports={followingReports}
          recommendedReports={recommendedReports}
          friendIds={friendIds}
          streamerIds={streamerIds}
          userId={user.id}
        />
      </div>

      {/* Right Sidebar Content */}
      <RightSidebarContent
        totalReports={totalReports}
        thisMonthReports={thisMonthReports}
        friendsCount={friendIds.length}
        uniqueAuthors={uniqueAuthors}
        uniqueScenarios={uniqueScenarios}
        survivalRate={survivalRate}
        plCount={plSessions}
        kpCount={kpSessions}
        trendingScenarios={trendingScenarios}
        isMeasuring={isMeasuring}
        measurementDay={currentDay}
        activeFriends={activeFriends}
        suggestedUsers={suggestedUsers}
        tier={(profile?.tier as 'free' | 'pro' | 'streamer') || 'free'}
      />
    </>
  )
}

// Right Sidebar Content Component
function RightSidebarContent({
  totalReports,
  thisMonthReports,
  friendsCount,
  uniqueAuthors,
  uniqueScenarios,
  survivalRate,
  plCount,
  kpCount,
  trendingScenarios,
  isMeasuring,
  measurementDay,
  activeFriends,
  suggestedUsers,
  tier,
}: {
  totalReports: number
  thisMonthReports: number
  friendsCount: number
  uniqueAuthors: number
  uniqueScenarios: number
  survivalRate: number
  plCount: number
  kpCount: number
  trendingScenarios: { name: string; author: string | null; count: number; trend: 'up' | 'new' | 'stable' }[]
  isMeasuring: boolean
  measurementDay: number
  activeFriends: { profile: any; lastActive: string; recentScenario?: string }[]
  suggestedUsers: SuggestedUser[]
  tier: 'free' | 'pro' | 'streamer'
}) {
  return (
    <div className="hidden xl:block fixed right-0 top-0 w-[350px] h-screen overflow-y-auto px-4 py-4 border-l border-border/40 glass-strong" style={{ scrollbarWidth: 'thin' }}>
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          placeholder="検索"
          className="w-full pl-10 pr-4 py-2.5 rounded-full glass border border-border/30 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none text-sm transition-colors"
        />
      </div>

      {/* Wallet status — owner badge or purchase CTA */}
      {tier === 'free' ? (
        <WalletPurchaseCTA />
      ) : (
        <WalletOwnerBadge tier={tier} />
      )}

      {/* Investigator Rank — gamification card */}
      <InvestigatorRank
        totalReports={totalReports}
        survivalRate={survivalRate}
        uniqueScenarios={uniqueScenarios}
      />

      {/* PL/KP Role Stats */}
      <RoleStats plCount={plCount} kpCount={kpCount} totalReports={totalReports} />

      {/* Active Friends */}
      <ActiveFriends friends={activeFriends} />

      {/* Suggested Users */}
      <SuggestedUsers users={suggestedUsers} />

      {/* Trending */}
      <TrendingScenarios scenarios={trendingScenarios} isMeasuring={isMeasuring} measurementDay={measurementDay} />

      {/* Mythos Tip — daily flavor text */}
      <div className="mt-4">
        <MythosTip />
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-muted-foreground space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="/terms" className="hover:underline">利用規約</a>
          <a href="/privacy" className="hover:underline">プライバシー</a>
          <a href="/pricing" className="hover:underline">料金プラン</a>
        </div>
        <p>© 2025 R&apos;lyeh Wallet</p>
      </div>
    </div>
  )
}

