'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { BookOpen, Users, Trophy, Clock, Percent, UserCheck, UserPlus, Loader2 } from 'lucide-react'
import type { Profile, PlayReport, ScenarioPreference } from '@/lib/types'
import { TierBadge } from '@/components/tier-badge'
import StatCard from '@/components/stat-card'
import { TrpgPreferenceDisplay } from '@/components/trpg-preference-display'
import { InvestigatorRank } from '@/components/dashboard-widgets'

interface UserStats {
  totalSessions: number
  asKP: number
  asPL: number
  uniqueScenarios: number
  totalHours: number
  survivalRate: number
}

interface FriendWithProfile {
  id: string
  profile: Profile
  isMutual?: boolean
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FriendCard({ friend, isMutual, onClose }: { friend: Profile; isMutual?: boolean; onClose?: () => void }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (onClose) onClose()
        router.push(`/user/${friend.username}`)
      }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors w-full text-left"
    >
      <Avatar className="w-10 h-10 rounded-xl">
        <AvatarImage src={friend.avatar_url || undefined} className="rounded-xl" />
        <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
          {(friend.display_name || friend.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {friend.display_name || friend.username}
        </p>
        <p className="text-xs text-muted-foreground">@{friend.username}</p>
      </div>
      {isMutual && (
        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          相互
        </span>
      )}
    </button>
  )
}

function FriendsDialog({
  friends,
  mutualFriends,
  triggerLabel,
  isOwnProfile
}: {
  friends: FriendWithProfile[]
  mutualFriends: FriendWithProfile[]
  triggerLabel: string
  isOwnProfile: boolean
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'mutual'>('all')
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground bg-transparent">
          <Users className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>フレンド一覧</DialogTitle>
        </DialogHeader>

        {!isOwnProfile && mutualFriends.length > 0 ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'mutual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">すべて ({friends.length})</TabsTrigger>
              <TabsTrigger value="mutual">相互フレンド ({mutualFriends.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4 max-h-80 overflow-y-auto space-y-1">
              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">フレンドがいません</p>
              ) : (
                friends.map((f) => (
                  <FriendCard key={f.id} friend={f.profile} isMutual={f.isMutual} onClose={() => setOpen(false)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="mutual" className="mt-4 max-h-80 overflow-y-auto space-y-1">
              {mutualFriends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">相互フレンドがいません</p>
              ) : (
                mutualFriends.map((f) => (
                  <FriendCard key={f.id} friend={f.profile} isMutual onClose={() => setOpen(false)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1">
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">フレンドがいません</p>
            ) : (
              friends.map((f) => (
                <FriendCard key={f.id} friend={f.profile} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reports, setReports] = useState<PlayReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [mutualFriends, setMutualFriends] = useState<FriendWithProfile[]>([])
  const [isFriend, setIsFriend] = useState(false)
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'received' | 'friends'>('none')
  const [actionLoading, setActionLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    asKP: 0,
    asPL: 0,
    uniqueScenarios: 0,
    totalHours: 0,
    survivalRate: 0,
  })
  const [statsTab, setStatsTab] = useState<'stats' | 'profile'>('stats')
  const [favoriteReports, setFavoriteReports] = useState<PlayReport[]>([])
  const [wantToPlayScenarios, setWantToPlayScenarios] = useState<ScenarioPreference[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!username) return

      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError || !profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)
      const isOwn = user?.id === profileData.id
      setIsOwnProfile(isOwn)

      // Check friendship status
      if (user && !isOwn) {
        // Check if I follow them
        const { data: iFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle()

        // Check if they follow me
        const { data: theyFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', profileData.id)
          .eq('following_id', user.id)
          .maybeSingle()

        if (iFollow && theyFollow) {
          setFriendRequestStatus('friends')
          setIsFriend(true)
        } else if (iFollow) {
          setFriendRequestStatus('pending')
        } else {
          // Check friend requests
          const { data: sentRequest } = await supabase
            .from('friend_requests')
            .select('id, status')
            .eq('from_user_id', user.id)
            .eq('to_user_id', profileData.id)
            .eq('status', 'pending')
            .maybeSingle()

          const { data: receivedRequest } = await supabase
            .from('friend_requests')
            .select('id, status')
            .eq('from_user_id', profileData.id)
            .eq('to_user_id', user.id)
            .eq('status', 'pending')
            .maybeSingle()

          if (sentRequest) {
            setFriendRequestStatus('pending')
          } else if (receivedRequest) {
            setFriendRequestStatus('received')
          } else {
            setFriendRequestStatus('none')
          }
        }
      }

      // Fetch play reports
      const { data: reportsData } = await supabase
        .from('play_reports')
        .select(`
          *,
          participants:play_report_participants(*)
        `)
        .eq('user_id', profileData.id)
        .order('play_date_start', { ascending: false })

      // Fetch friends - users this profile is mutually connected with
      // A friend = mutual follow (both follow each other)
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profileData.id)

      const followingIds = followingData?.map(f => f.following_id) || []

      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profileData.id)

      const followerIds = followersData?.map(f => f.follower_id) || []

      // Mutual friends = users who both follow and are followed by this profile
      const mutualIds = followingIds.filter(id => followerIds.includes(id))

      // Fetch profile data for mutual friends
      if (mutualIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', mutualIds)

        if (friendProfiles) {
          const friendsList: FriendWithProfile[] = friendProfiles.map(p => ({
            id: p.id,
            profile: p,
            isMutual: true
          }))
          setFriends(friendsList)
        }
      }

      // If viewing another user's profile, find mutual friends with current user
      if (user && !isOwn) {
        const { data: myFollowing } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        const myFollowingIds = myFollowing?.map(f => f.following_id) || []

        // Mutual with current user = friends of the profile that I also follow
        const mutualWithMe = mutualIds.filter(id => myFollowingIds.includes(id))

        if (mutualWithMe.length > 0) {
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', mutualWithMe)

          if (mutualProfiles) {
            setMutualFriends(mutualProfiles.map(p => ({
              id: p.id,
              profile: p,
              isMutual: true
            })))
          }
        }
      } else if (isOwn) {
        // For own profile, all friends are "mutual" by definition
        setMutualFriends(friends)
      }

      if (reportsData) {
        setReports(reportsData)

        // Calculate stats
        const totalSessions = reportsData.length
        const uniqueScenarios = new Set(reportsData.map(r => r.scenario_name)).size
        const totalHours = reportsData.reduce((acc, r) => acc + (r.play_duration || 0), 0)

        // Count KP and PL - match by user_id OR username
        let asKP = 0
        let asPL = 0
        let surviveCount = 0
        let totalPLSessions = 0
        const countedReportIds = new Set<string>()

        // Helper to check if participant matches this profile
        const isProfileParticipant = (p: { user_id?: string | null; username?: string | null }) => {
          if (p.user_id === profileData.id) return true
          const pUsername = p.username?.toLowerCase() || ''
          const profileUsername = profileData.username?.toLowerCase() || ''
          const profileDisplayName = profileData.display_name?.toLowerCase() || ''
          // Match @username format or display name
          return pUsername === `@${profileUsername}` ||
            pUsername === profileUsername ||
            (profileDisplayName && pUsername === profileDisplayName)
        }

        // Count from own reports' participants
        reportsData.forEach(report => {
          report.participants?.forEach(p => {
            if (isProfileParticipant(p)) {
              const key = `${report.id}-${p.role}`
              if (!countedReportIds.has(key)) {
                countedReportIds.add(key)
                if (p.role === 'KP') asKP++
                if (p.role === 'PL') {
                  asPL++
                  const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
                  if (p.result === 'survive' || isLost) {
                    totalPLSessions++
                    if (p.result === 'survive') surviveCount++
                  }
                }
              }
            }
          })
        })

        // Also count participations in other people's reports
        const { data: allParticipations } = await supabase
          .from('play_report_participants')
          .select('role, result, play_report_id, user_id, username')

        if (allParticipations) {
          allParticipations.forEach(p => {
            if (isProfileParticipant(p)) {
              const key = `${p.play_report_id}-${p.role}`
              if (!countedReportIds.has(key)) {
                countedReportIds.add(key)
                if (p.role === 'KP') asKP++
                if (p.role === 'PL') {
                  asPL++
                  const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
                  if (p.result === 'survive' || isLost) {
                    totalPLSessions++
                    if (p.result === 'survive') surviveCount++
                  }
                }
              }
            }
          })
        }

        const survivalRate = totalPLSessions > 0
          ? Math.round((surviveCount / totalPLSessions) * 100)
          : 0

        setStats({
          totalSessions,
          asKP,
          asPL,
          uniqueScenarios,
          totalHours,
          survivalRate,
        })
      }

      // Fetch favorite reports for TRPG profile display
      if (profileData.favorite_report_ids?.length > 0) {
        const { data: favReports } = await supabase
          .from('play_reports')
          .select('id, scenario_name, cover_image_url')
          .in('id', profileData.favorite_report_ids)

        if (favReports) {
          setFavoriteReports(favReports as PlayReport[])
        }
      }

      // Fetch want_to_play scenario preferences
      const { data: scenarioPrefs } = await supabase
        .from('scenario_preferences')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('preference_type', 'want_to_play')
        .order('created_at', { ascending: true })

      if (scenarioPrefs) {
        setWantToPlayScenarios(scenarioPrefs)
      }

      setLoading(false)
    }

    fetchData()
  }, [username])

  // Delete folder handler (own profile only)
  async function sendFriendRequest() {
    if (!currentUserId || !profile) return

    setActionLoading(true)
    const supabase = createClient()

    console.log('[v0] Sending friend request from', currentUserId, 'to', profile.id)

    // Check for existing request first
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${profile.id}),and(from_user_id.eq.${profile.id},to_user_id.eq.${currentUserId})`)
      .maybeSingle()

    console.log('[v0] Existing request:', existingRequest)

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        toast.info('既に申請中です')
        setFriendRequestStatus('pending')
        setActionLoading(false)
        return
      }

      // If rejected or other status, update to pending
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({
          status: 'pending',
          from_user_id: currentUserId,
          to_user_id: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id)

      if (updateError) {
        console.error('[v0] Update error:', updateError)
        toast.error('フレンド申請に失敗しました')
        setActionLoading(false)
        return
      }
    } else {
      // Create new friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: currentUserId,
          to_user_id: profile.id,
          status: 'pending'
        })

      if (error) {
        console.error('[v0] Insert error:', error)
        toast.error('フレンド申請に失敗しました')
        setActionLoading(false)
        return
      }
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'friend_request',
        from_user_id: currentUserId,
      })

    setFriendRequestStatus('pending')
    toast.success('フレンド申請を送信しました')
    setActionLoading(false)
  }

  async function acceptFriendRequest() {
    if (!currentUserId || !profile) return

    setActionLoading(true)
    const supabase = createClient()

    // Update request status
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('from_user_id', profile.id)
      .eq('to_user_id', currentUserId)

    // Create mutual follows
    await supabase
      .from('follows')
      .upsert([
        { follower_id: currentUserId, following_id: profile.id },
        { follower_id: profile.id, following_id: currentUserId }
      ])

    // Notify the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'follow',
        from_user_id: currentUserId,
      })

    setFriendRequestStatus('friends')
    setIsFriend(true)
    toast.success('フレンド申請を承認しました')
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start gap-6">
          <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-72" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">ユーザーが見つかりません</h1>
        <p className="text-sm text-muted-foreground">@{username} は存在しないか、削除された可能性があります。</p>
        <Link href="/dashboard">
          <Button className="mt-6">ダッシュボードに戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Profile Header — visionOS hero card */}
      <div className="flex items-start gap-6 rounded-3xl glass glass-sheen shadow-depth-2 px-6 py-6 sm:px-8 sm:py-7">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-border/40 shadow-depth-1">
          <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name || ''} />
          <AvatarFallback className="rounded-2xl text-3xl sm:text-4xl bg-muted">
            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <TierBadge profile={profile} size="md" />
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.twitter_id && (
              <a
                href={`https://twitter.com/${profile.twitter_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mt-1"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
            )}
          </div>

          {profile.bio && (
            <p className="text-muted-foreground whitespace-pre-wrap max-w-md text-sm">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <FriendsDialog
              friends={friends}
              mutualFriends={isOwnProfile ? friends : mutualFriends}
              triggerLabel={`${friends.length} フレンド`}
              isOwnProfile={isOwnProfile}
            />

            {isOwnProfile ? (
              <Link href="/settings">
                <Button variant="outline" size="sm" className="bg-transparent">
                  プロフィールを編集
                </Button>
              </Link>
            ) : (
              <>
                {friendRequestStatus === 'none' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className="gap-2 bg-transparent"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    フレンド申請
                  </Button>
                )}
                {friendRequestStatus === 'pending' && (
                  <Button variant="ghost" size="sm" disabled className="gap-2 text-amber-600 bg-transparent">
                    <Loader2 className="w-4 h-4" />
                    申請中
                  </Button>
                )}
                {friendRequestStatus === 'received' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={acceptFriendRequest}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    承認する
                  </Button>
                )}
                {friendRequestStatus === 'friends' && (
                  <Button variant="ghost" size="sm" disabled className="gap-2 text-green-600 bg-transparent">
                    <UserCheck className="w-4 h-4" />
                    フレンド
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats / Profile Tab Switcher */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatsTab('stats')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statsTab === 'stats'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
          >
            統計
          </button>
          <button
            type="button"
            onClick={() => setStatsTab('profile')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statsTab === 'profile'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
          >
            プロフィール
          </button>
        </div>

        {statsTab === 'stats' ? (
          <div className="space-y-4">
            <InvestigatorRank
              totalReports={stats.totalSessions}
              survivalRate={stats.survivalRate}
              uniqueScenarios={stats.uniqueScenarios}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={<BookOpen className="w-4 h-4" />} label="総セッション" value={stats.totalSessions} />
              <StatCard icon={<Users className="w-4 h-4" />} label="KP回数" value={stats.asKP} />
              <StatCard icon={<Trophy className="w-4 h-4" />} label="PL回数" value={stats.asPL} />
              <StatCard icon={<BookOpen className="w-4 h-4" />} label="シナリオ数" value={stats.uniqueScenarios} />
              <StatCard icon={<Clock className="w-4 h-4" />} label="総プレイ時間" value={`${stats.totalHours.toFixed(0)}h`} />
              <StatCard icon={<Percent className="w-4 h-4" />} label="生還率" value={`${stats.survivalRate}%`} />
            </div>
          </div>
        ) : (
          <TrpgPreferenceDisplay profile={profile} favoriteReports={favoriteReports} wantToPlayScenarios={wantToPlayScenarios} />
        )}
      </div>

      {/* Achievements placeholder */}
      {statsTab === 'stats' && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/50 glass px-6 py-8 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">アチーブメント</p>
          <p className="text-xs text-muted-foreground/60">Coming soon — セッション数・生還・KP達成など</p>
        </div>
      )}
    </div>
  )
}
