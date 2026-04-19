'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { DashboardFeed } from '@/components/dashboard-feed'
import type { PlayReport } from '@/lib/types'

const REPORT_SELECT = `
  *,
  profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
  participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
  likes:likes(id)
`

export function WalletTimeline() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    friendReports: PlayReport[]
    followingReports: PlayReport[]
    recommendedReports: PlayReport[]
    friendIds: string[]
    streamerIds: string[]
    userId: string
  } | null>(null)

  useEffect(() => {
    async function fetchTimelineData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: following }, { data: followers }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('follows').select('follower_id').eq('following_id', user.id),
      ])

      const followingIds = following?.map(f => f.following_id) || []
      const followerIds = followers?.map(f => f.follower_id) || []
      const friendIds = followingIds.filter(id => followerIds.includes(id))

      let friendReports: PlayReport[] = []
      if (friendIds.length > 0) {
        const { data } = await supabase
          .from('play_reports')
          .select(REPORT_SELECT)
          .in('user_id', friendIds)
          .in('privacy_setting', ['public', 'followers'])
          .eq('is_mini', false)
          .order('play_date_start', { ascending: false })
          .limit(10)
        friendReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 })) as PlayReport[]
      }

      const nonMutualIds = followingIds.filter(id => !followerIds.includes(id))
      let streamerIds: string[] = []
      let followingReports: PlayReport[] = []

      if (nonMutualIds.length > 0) {
        const { data: streamerProfiles } = await supabase
          .from('profiles').select('id').in('id', nonMutualIds).eq('tier', 'streamer')
        streamerIds = streamerProfiles?.map(p => p.id) || []

        if (streamerIds.length > 0) {
          const { data } = await supabase
            .from('play_reports')
            .select(REPORT_SELECT)
            .in('user_id', streamerIds)
            .eq('privacy_setting', 'public')
            .eq('is_mini', false)
            .order('play_date_start', { ascending: false })
            .limit(10)
          followingReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 })) as PlayReport[]
        }
      }

      const { data: recentReports } = await supabase
        .from('play_reports')
        .select(REPORT_SELECT)
        .eq('privacy_setting', 'public')
        .eq('is_mini', false)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const recommendedReports = (recentReports || []).map(r => ({
        ...r,
        likes_count: r.likes?.length || 0,
      })) as PlayReport[]

      setData({ friendReports, followingReports, recommendedReports, friendIds, streamerIds, userId: user.id })
      setLoading(false)
    }

    fetchTimelineData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  return (
    <DashboardFeed
      initialFriendReports={data.friendReports}
      initialFollowingReports={data.followingReports}
      recommendedReports={data.recommendedReports}
      friendIds={data.friendIds}
      streamerIds={data.streamerIds}
      userId={data.userId}
    />
  )
}
