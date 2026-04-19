'use client'

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Heart,
  UserPlus,
  Users,
  AtSign,
  Share2,
  Info,
  Check,
  X,
  Loader2,
  Filter,
  BellOff,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  type: string
  is_read: boolean
  created_at: string
  from_user_id: string | null
  from_user?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  play_report?: {
    id: string
    scenario_name: string
  }
}

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
}

type FilterType = 'all' | 'like' | 'follow' | 'mention' | 'friend_request'

// Notification type config — color, icon, accent for each type
const NOTIF_CONFIG: Record<string, {
  icon: React.ReactNode
  accentColor: string     // icon background (glass + subtle tint)
  accentRing: string      // ring color for avatar
  label: string
}> = {
  like: {
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    accentColor: 'glass border border-rose-500/20 shadow-depth-1',
    accentRing: 'ring-rose-500/25',
    label: 'いいね',
  },
  follow: {
    icon: <Users className="w-4 h-4 text-emerald-500" />,
    accentColor: 'glass border border-emerald-500/20 shadow-depth-1',
    accentRing: 'ring-emerald-500/25',
    label: 'フレンド',
  },
  friend_request: {
    icon: <UserPlus className="w-4 h-4 text-sky-500" />,
    accentColor: 'glass border border-sky-500/20 shadow-depth-1',
    accentRing: 'ring-sky-500/25',
    label: '申請',
  },
  mention: {
    icon: <AtSign className="w-4 h-4 text-amber-500" />,
    accentColor: 'glass border border-amber-500/20 shadow-depth-1',
    accentRing: 'ring-amber-500/25',
    label: 'メンション',
  },
  share_code: {
    icon: <Share2 className="w-4 h-4 text-violet-500" />,
    accentColor: 'glass border border-violet-500/20 shadow-depth-1',
    accentRing: 'ring-violet-500/25',
    label: '共有',
  },
  system: {
    icon: <Info className="w-4 h-4 text-muted-foreground" />,
    accentColor: 'glass border border-border/40 shadow-depth-1',
    accentRing: 'ring-border',
    label: 'システム',
  },
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`

  const d = new Date(dateString)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// Group notifications by date
function groupByDate(notifications: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)

  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: '今日', items: [] },
    { label: '昨日', items: [] },
    { label: '今週', items: [] },
    { label: 'それ以前', items: [] },
  ]

  for (const n of notifications) {
    const d = new Date(n.created_at)
    if (d >= today) {
      groups[0].items.push(n)
    } else if (d >= yesterday) {
      groups[1].items.push(n)
    } else if (d >= thisWeekStart) {
      groups[2].items.push(n)
    } else {
      groups[3].items.push(n)
    }
  }

  return groups.filter(g => g.items.length > 0)
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<Map<string, FriendRequest>>(new Map())
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    async function loadNotifications() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: notifs } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:profiles!notifications_from_user_id_fkey(username, display_name, avatar_url),
          play_report:play_reports(id, scenario_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (notifs) {
        setNotifications(notifs)

        // Mark all as read
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
        }

        // Fetch pending friend requests
        const friendRequestNotifs = notifs.filter(n => n.type === 'friend_request' && n.from_user_id)
        if (friendRequestNotifs.length > 0) {
          const fromUserIds = friendRequestNotifs.map(n => n.from_user_id).filter(Boolean)

          const { data: requests } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('to_user_id', user.id)
            .in('from_user_id', fromUserIds)
            .eq('status', 'pending')

          if (requests) {
            const requestMap = new Map<string, FriendRequest>()
            requests.forEach(req => {
              requestMap.set(req.from_user_id, req)
            })
            setPendingRequests(requestMap)
          }
        }
      }

      setLoading(false)
    }

    loadNotifications()
  }, [])

  async function handleAcceptRequest(fromUserId: string) {
    setProcessingRequest(fromUserId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')

      if (updateError) throw updateError

      const { data: existingFollow1 } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', fromUserId)
        .maybeSingle()

      if (!existingFollow1) {
        const { error: follow1Error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: fromUserId })
        if (follow1Error) throw follow1Error
      }

      const { data: existingFollow2 } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', fromUserId)
        .eq('following_id', user.id)
        .maybeSingle()

      if (!existingFollow2) {
        const { error: follow2Error } = await supabase
          .from('follows')
          .insert({ follower_id: fromUserId, following_id: user.id })
        if (follow2Error) throw follow2Error
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: fromUserId,
          type: 'follow',
          from_user_id: user.id,
        })

      setPendingRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(fromUserId)
        return newMap
      })

      toast.success('フレンド申請を承認しました')
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  async function handleRejectRequest(fromUserId: string) {
    setProcessingRequest(fromUserId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')

      if (error) throw error

      setPendingRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(fromUserId)
        return newMap
      })

      toast.success('フレンド申請を拒否しました')
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter(n => n.type === filter)
  }, [notifications, filter])

  // Group by date
  const groupedNotifications = useMemo(() => {
    return groupByDate(filteredNotifications)
  }, [filteredNotifications])

  // Count unread
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Count by type for filter badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    notifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1
    })
    return counts
  }, [notifications])

  if (loading) {
    return (
      <div className="-my-6 max-w-[600px] mx-auto border-x border-border/40 min-h-screen">
        <div className="sticky top-0 z-10 glass-strong border-b border-border/40 px-5 py-3.5">
          <h1 className="text-xl font-semibold tracking-tight">通知</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="-my-6 max-w-[600px] mx-auto border-x border-border/40 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-strong border-b border-border/40">
        <div className="px-5 py-3.5">
          <h1 className="text-xl font-semibold tracking-tight">通知</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex px-1 overflow-x-auto">
          <FilterTab
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            count={notifications.length}
          >
            すべて
          </FilterTab>
          <FilterTab
            active={filter === 'like'}
            onClick={() => setFilter('like')}
            count={typeCounts['like'] || 0}
            color="text-rose-500"
          >
            <Heart className="w-3.5 h-3.5" />
            いいね
          </FilterTab>
          <FilterTab
            active={filter === 'friend_request'}
            onClick={() => setFilter('friend_request')}
            count={typeCounts['friend_request'] || 0}
            color="text-sky-500"
          >
            <UserPlus className="w-3.5 h-3.5" />
            申請
          </FilterTab>
          <FilterTab
            active={filter === 'mention'}
            onClick={() => setFilter('mention')}
            count={typeCounts['mention'] || 0}
            color="text-amber-500"
          >
            <AtSign className="w-3.5 h-3.5" />
            メンション
          </FilterTab>
          <FilterTab
            active={filter === 'follow'}
            onClick={() => setFilter('follow')}
            count={typeCounts['follow'] || 0}
            color="text-emerald-500"
          >
            <Users className="w-3.5 h-3.5" />
            フレンド
          </FilterTab>
        </div>
      </div>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <div>
          {groupedNotifications.map((group) => (
            <div key={group.label}>
              {/* Date group header */}
              <div className="px-5 py-2 bg-background/30 backdrop-blur-sm border-b border-border/30">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
              </div>

              {/* Notifications in this group */}
              {group.items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  hasPendingRequest={
                    notification.type === 'friend_request' &&
                    !!notification.from_user_id &&
                    pendingRequests.has(notification.from_user_id)
                  }
                  isProcessing={processingRequest === notification.from_user_id}
                  onAccept={() => notification.from_user_id && handleAcceptRequest(notification.from_user_id)}
                  onReject={() => notification.from_user_id && handleRejectRequest(notification.from_user_id)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <EmptyNotifications filter={filter} />
      )}
    </div>
  )
}

// =============================================
// Filter Tab Component
// =============================================
function FilterTab({
  active,
  onClick,
  count,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  color?: string
  children: React.ReactNode
}) {
  if (count === 0 && !active) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        color && active ? color : '',
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn(
          'text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
          active ? 'bg-primary/10 text-primary font-bold' : 'bg-muted text-muted-foreground',
        )}>
          {count}
        </span>
      )}
      {/* Active indicator bar */}
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
      )}
    </button>
  )
}

// =============================================
// Single Notification Row — Twitter-style
// =============================================
function NotificationRow({
  notification,
  hasPendingRequest,
  isProcessing,
  onAccept,
  onReject,
}: {
  notification: NotificationItem
  hasPendingRequest: boolean
  isProcessing: boolean
  onAccept: () => void
  onReject: () => void
}) {
  const config = NOTIF_CONFIG[notification.type] || NOTIF_CONFIG.system
  const name = notification.from_user?.display_name || notification.from_user?.username || '誰か'

  // Build message parts for richer rendering
  const scenarioName = notification.play_report?.scenario_name

  const href = notification.play_report?.id
    ? `/reports/${notification.play_report.id}`
    : notification.from_user?.username
      ? `/user/${notification.from_user.username}`
      : '#'

  return (
    <div
      className={cn(
        'border-b border-border/40 transition-colors hover:bg-background/40',
        !notification.is_read && 'bg-primary/[0.03]',
      )}
    >
      <div className="px-5 py-3.5">
        <div className="flex gap-3">
          {/* Left: Type icon */}
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', config.accentColor)}>
            {config.icon}
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0">
            {/* Avatar + message */}
            <div className="flex items-start gap-2.5">
              {/* User avatar(s) */}
              {notification.from_user && (
                <Link href={`/user/${notification.from_user.username}`} className="shrink-0">
                  <Avatar className={cn('w-9 h-9 rounded-xl ring-1 ring-offset-1 ring-offset-background', config.accentRing)}>
                    <AvatarImage src={notification.from_user.avatar_url || undefined} className="rounded-xl" />
                    <AvatarFallback className="text-xs rounded-xl">
                      {(notification.from_user.display_name || notification.from_user.username)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <Link href={href} className="block group">
                  <p className="text-[14px] leading-snug">
                    <span className="font-bold group-hover:underline">{name}</span>
                    <span className="text-muted-foreground">
                      {notification.type === 'like' && 'が'}
                      {notification.type === 'mention' && 'があなたを'}
                      {notification.type === 'share_code' && 'が'}
                      {notification.type === 'follow' && 'があなたとフレンドになりました'}
                      {notification.type === 'friend_request' && 'からフレンド申請が届きました'}
                      {notification.type === 'system' && ': お知らせ'}
                    </span>
                    {scenarioName && (notification.type === 'like' || notification.type === 'mention' || notification.type === 'share_code') && (
                      <>
                        <span className="font-semibold text-foreground">「{scenarioName}」</span>
                        <span className="text-muted-foreground">
                          {notification.type === 'like' && 'にいいねしました'}
                          {notification.type === 'mention' && 'でメンションしました'}
                          {notification.type === 'share_code' && 'を共有しました'}
                        </span>
                      </>
                    )}
                  </p>
                </Link>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(notification.created_at)}
                </p>

                {/* Friend Request Actions */}
                {hasPendingRequest && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={(e) => { e.preventDefault(); onAccept() }}
                      disabled={isProcessing}
                      className="gap-1.5 rounded-full px-5 h-8 text-xs"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      承認する
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); onReject() }}
                      disabled={isProcessing}
                      className="gap-1.5 rounded-full px-5 h-8 text-xs bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                      拒否
                    </Button>
                  </div>
                )}

                {/* Already processed friend request */}
                {notification.type === 'friend_request' &&
                  notification.from_user_id &&
                  !hasPendingRequest && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      処理済み
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator dot */}
      {!notification.is_read && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}
    </div>
  )
}

// =============================================
// Empty State
// =============================================
function EmptyNotifications({ filter }: { filter: FilterType }) {
  const isFiltered = filter !== 'all'

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        {isFiltered ? (
          <Filter className="w-7 h-7 text-muted-foreground/40" />
        ) : (
          <BellOff className="w-7 h-7 text-muted-foreground/40" />
        )}
      </div>
      <p className="font-medium text-muted-foreground">
        {isFiltered ? 'この種類の通知はまだありません' : '通知はまだありません'}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 max-w-[280px]">
        {isFiltered
          ? 'フィルターを変更してみてください'
          : 'フレンドをフォローしたり記録を投稿すると、ここにアクティビティが表示されます'}
      </p>
      {!isFiltered && (
        <div className="flex gap-2 mt-5">
          <Link href="/search">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 bg-transparent">
              <Users className="w-3.5 h-3.5" />
              ユーザーを探す
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
