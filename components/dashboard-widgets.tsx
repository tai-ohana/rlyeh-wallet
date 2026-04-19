'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  BookOpen,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Skull,
  Moon,
  Eye,
  Crown,
  Compass,
  Scroll,
  Shield,
  Swords,
  UserPlus,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { NumberTicker } from '@/components/ui/number-ticker'

// =============================================
// 1. Welcome Header — Greeting + quick stats in feed column
// =============================================
interface WelcomeHeaderProps {
  displayName: string
  totalReports: number
  thisMonthReports: number
  streak: number // consecutive days/weeks with activity
  sanity: number // gamified "SAN値" 0-100
}

export function WelcomeHeader({
  displayName,
  totalReports,
  thisMonthReports,
  streak,
  sanity,
}: WelcomeHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return 'こんな時間まで探索中…'
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'こんばんは'
  }, [])

  const firstName = displayName?.split(/[\s@]/)[0] || '探索者'

  return (
    <div className="px-4 py-4 border-b border-border/40">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h2 className="text-lg font-bold">{firstName}さん</h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 shadow-depth-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <NumberTicker
              value={streak}
              className="text-sm font-bold text-foreground"
            />
            <span className="text-[11px] text-muted-foreground">週連続</span>
          </div>
        )}
      </div>

      {/* Quick stat pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <QuickStatPill
          icon={<BookOpen className="w-3.5 h-3.5" />}
          value={totalReports}
          label="通過"
          color="blue"
        />
        <QuickStatPill
          icon={<Calendar className="w-3.5 h-3.5" />}
          value={thisMonthReports}
          label="今月"
          color="green"
        />
        <SanityPill sanity={sanity} />
      </div>
    </div>
  )
}

function QuickStatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const iconColorMap = {
    blue: 'text-sky-500',
    green: 'text-emerald-500',
    orange: 'text-orange-500',
    purple: 'text-violet-500',
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 shadow-depth-1 shrink-0">
      <span className={iconColorMap[color]}>{icon}</span>
      <NumberTicker value={value} className="text-sm font-bold text-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

// SAN値 pill — fun CoC gamification
function SanityPill({ sanity }: { sanity: number }) {
  const iconColor = sanity >= 70
    ? 'text-emerald-500'
    : sanity >= 40
      ? 'text-amber-500'
      : 'text-rose-500'

  const sanityIcon = sanity >= 70
    ? <Eye className="w-3.5 h-3.5" />
    : sanity >= 40
      ? <Moon className="w-3.5 h-3.5" />
      : <Skull className="w-3.5 h-3.5" />

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 shadow-depth-1 shrink-0">
      <span className={iconColor}>{sanityIcon}</span>
      <span className="text-[11px] font-medium text-muted-foreground">SAN</span>
      <NumberTicker value={sanity} className="text-sm font-bold text-foreground" />
    </div>
  )
}

// =============================================
// 2. Role Stats — PL/KP counts
// =============================================
interface RoleStatsProps {
  plCount: number
  kpCount: number
  totalReports: number
}

export function RoleStats({ plCount, kpCount, totalReports }: RoleStatsProps) {
  const plRatio = totalReports > 0 ? Math.round((plCount / totalReports) * 100) : 0
  const kpRatio = totalReports > 0 ? Math.round((kpCount / totalReports) * 100) : 0

  return (
    <div className="rounded-2xl glass glass-sheen shadow-depth-1 p-4 mb-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-foreground/90">
        <Swords className="w-4 h-4 text-violet-500" />
        探索スタイル
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {/* PL */}
        <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] font-medium text-muted-foreground">PL（探索者）</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{plCount}<span className="text-[10px] text-muted-foreground ml-1 font-normal">回</span></p>
          {totalReports > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
                  style={{ width: `${plRatio}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{plRatio}%</p>
            </div>
          )}
        </div>
        {/* KP */}
        <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-medium text-muted-foreground">KP（進行役）</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{kpCount}<span className="text-[10px] text-muted-foreground ml-1 font-normal">回</span></p>
          {totalReports > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  style={{ width: `${kpRatio}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{kpRatio}%</p>
            </div>
          )}
        </div>
      </div>
      {/* Style label */}
      {totalReports > 0 && (
        <p className="text-[11px] text-muted-foreground text-center mt-2.5">
          {plCount === 0 && kpCount === 0
            ? 'まだ記録がありません'
            : plCount > kpCount * 2
              ? '探索者タイプ — PLが得意'
              : kpCount > plCount * 2
                ? '進行役タイプ — KPが得意'
                : 'バランスタイプ — PL/KP両刀'}
        </p>
      )}
    </div>
  )
}

// =============================================
// 3. Active Friends / Recent Activity
// =============================================
interface FriendActivity {
  profile: Profile
  lastActive: string // ISO date
  recentScenario?: string
}

interface ActiveFriendsProps {
  friends: FriendActivity[]
}

export function ActiveFriends({ friends }: ActiveFriendsProps) {
  if (friends.length === 0) return null

  return (
    <div className="rounded-2xl glass glass-sheen shadow-depth-1 p-4 mb-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-foreground/90">
        <Users className="w-4 h-4 text-sky-500" />
        アクティブなフレンド
      </h3>
      <div className="space-y-1">
        {friends.slice(0, 5).map((friend) => {
          const timeDiff = Date.now() - new Date(friend.lastActive).getTime()
          const isOnline = timeDiff < 1000 * 60 * 60 * 24 // 24h
          const timeAgo = formatShortTimeAgo(friend.lastActive)

          return (
            <Link
              key={friend.profile.id}
              href={`/user/${friend.profile.username}`}
              className="flex items-center gap-2.5 -mx-1.5 px-1.5 py-1.5 rounded-xl hover:bg-background/50 transition-colors"
            >
              <div className="relative shrink-0">
                <Avatar className="w-9 h-9 rounded-xl">
                  <AvatarImage src={friend.profile.avatar_url || undefined} className="rounded-xl" />
                  <AvatarFallback className="text-xs rounded-xl">
                    {(friend.profile.display_name || friend.profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
                    <span className="absolute w-3 h-3 rounded-full bg-emerald-400/40 animate-ping" />
                    <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {friend.profile.display_name || friend.profile.username}
                </p>
                {friend.recentScenario && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {friend.recentScenario}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {timeAgo}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function formatShortTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}d`
  return `${Math.floor(diffDay / 7)}w`
}

// =============================================
// 4. Suggested Users
// =============================================
export type SuggestedUserReason =
  | 'friend_of_friend'   // フォロワーがフォローしている
  | 'same_scenario'      // 同じシナリオを遊んだ
  | 'active_kp'          // アクティブなKP

export interface SuggestedUser {
  profile: Profile
  reason: SuggestedUserReason
  reasonDetail?: string  // シナリオ名など
}

interface SuggestedUsersProps {
  users: SuggestedUser[]
}

export function SuggestedUsers({ users }: SuggestedUsersProps) {
  if (users.length === 0) return null

  function reasonLabel(user: SuggestedUser) {
    switch (user.reason) {
      case 'friend_of_friend':
        return 'フォロワーがフォロー中'
      case 'same_scenario':
        return user.reasonDetail
          ? `「${user.reasonDetail}」を遊んだ`
          : '同じシナリオを遊んだ'
      case 'active_kp':
        return 'アクティブなKP'
    }
  }

  return (
    <div className="rounded-2xl glass glass-sheen shadow-depth-1 p-4 mb-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-foreground/90">
        <UserPlus className="w-4 h-4 text-emerald-500" />
        おすすめユーザー
      </h3>
      <div className="space-y-3">
        {users.slice(0, 5).map((u) => (
          <div key={u.profile.id} className="flex items-center gap-2.5">
            <Link href={`/user/${u.profile.username}`} className="shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src={u.profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(u.profile.display_name || u.profile.username)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/user/${u.profile.username}`}
                className="text-sm font-medium hover:underline truncate block"
              >
                {u.profile.display_name || u.profile.username}
              </Link>
              <p className="text-[10px] text-muted-foreground truncate">
                {reasonLabel(u)}
              </p>
            </div>
            <Link
              href={`/user/${u.profile.username}`}
              className="shrink-0 text-[11px] text-primary hover:underline font-medium"
            >
              見る
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================
// 5. Investigator Rank Card — gamification
// =============================================
interface InvestigatorRankProps {
  totalReports: number
  survivalRate: number
  uniqueScenarios: number
}

const RANKS = [
  { min: 0, title: '見習い探索者', icon: Compass, color: 'text-muted-foreground' },
  { min: 5, title: '新米探索者', icon: Scroll, color: 'text-emerald-500' },
  { min: 15, title: '一般探索者', icon: BookOpen, color: 'text-sky-500' },
  { min: 30, title: 'ベテラン探索者', icon: Star, color: 'text-amber-500' },
  { min: 50, title: '上級探索者', icon: Crown, color: 'text-violet-500' },
  { min: 100, title: '伝説の探索者', icon: Eye, color: 'text-rose-500' },
]

export function InvestigatorRank({ totalReports, survivalRate, uniqueScenarios }: InvestigatorRankProps) {
  const rank = useMemo(() => {
    let current = RANKS[0]
    for (const r of RANKS) {
      if (totalReports >= r.min) current = r
    }
    return current
  }, [totalReports])

  const nextRank = useMemo(() => {
    const idx = RANKS.indexOf(rank)
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
  }, [rank])

  const progress = nextRank
    ? ((totalReports - rank.min) / (nextRank.min - rank.min)) * 100
    : 100

  const Icon = rank.icon

  return (
    <div className="rounded-2xl glass glass-sheen shadow-depth-1 p-4 mb-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-foreground/90">
        <Compass className="w-4 h-4 text-violet-500" />
        探索者ランク
      </h3>

      {/* Rank hero — glass badge with icon */}
      <div className="flex items-center gap-3 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/30 p-3 mb-3">
        <div className="w-11 h-11 rounded-xl glass border border-border/40 shadow-depth-1 flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${rank.color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{rank.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalReports}回の通過 · 生還率 {survivalRate}%
          </p>
        </div>
      </div>

      {/* Progress bar to next rank */}
      {nextRank && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{rank.title}</span>
            <span>{nextRank.title}</span>
          </div>
          <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            あと{nextRank.min - totalReports}回で昇格
          </p>
        </div>
      )}

      {/* Mini stats row */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground">{totalReports}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">通過数</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground">{survivalRate}<span className="text-[10px] text-muted-foreground ml-0.5 font-normal">%</span></p>
          <p className="text-[10px] text-muted-foreground mt-0.5">生還率</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground">{uniqueScenarios}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">シナリオ</p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// 5. Today's Cthulhu Mythos Tip — small flavor text
// =============================================
const MYTHOS_TIPS = [
  { text: '「それは死んでいるのではない。永遠に横たわる奇妙な死者は、永劫の時の中にあっては死することさえありうる」', source: 'H.P.ラヴクラフト' },
  { text: 'ミスカトニック大学の図書館には「ネクロノミコン」の写本があるとされている', source: '神話豆知識' },
  { text: 'SAN値の最大値はPOW×5で決まる。日々の正気を大切に…', source: 'KPのアドバイス' },
  { text: 'クトゥルフ神話TRPGの第1版は1981年に発売された', source: '歴史豆知識' },
  { text: '「窓に！窓に！」— 恐怖の表現には具体性が大切', source: 'KPのアドバイス' },
  { text: '旧き神々は味方ではない。ただ敵の敵というだけだ', source: '神話豆知識' },
  { text: '調査を怠った探索者は長く生き延びることはできない', source: 'KPのアドバイス' },
  { text: 'アーカムの街は架空の都市だが、マサチューセッツ州がモデル', source: '歴史豆知識' },
  { text: '新版のルールブックが出ても旧版のシナリオは大体遊べる', source: 'KPのアドバイス' },
  { text: '探索者の平均寿命はKPの優しさに比例する', source: '格言' },
  { text: 'ダイスの目は嘘をつかない。が、KPは嘘をつく', source: '格言' },
  { text: '初めてのシナリオは短めがおすすめ。3〜4時間で終わるものが良い', source: 'KPのアドバイス' },
]

export function MythosTip() {
  // Pick based on date so it changes daily
  const tip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )
    return MYTHOS_TIPS[dayOfYear % MYTHOS_TIPS.length]
  }, [])

  return (
    <div className="rounded-2xl glass glass-sheen shadow-depth-1 bg-gradient-to-br from-transparent to-primary/5 p-4 mb-4">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Scroll className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">今日の神話知識</p>
          <p className="text-sm leading-relaxed">{tip.text}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5">— {tip.source}</p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// 6. Milestone Toast — inline celebration when user hits milestones
// =============================================
interface MilestoneProps {
  totalReports: number
}

const MILESTONES = [1, 5, 10, 25, 50, 100, 200, 500]

export function MilestoneBanner({ totalReports }: MilestoneProps) {
  const milestone = useMemo(() => {
    // Find the highest milestone the user just reached
    const reached = MILESTONES.filter(m => totalReports >= m)
    if (reached.length === 0) return null
    const latest = reached[reached.length - 1]
    // Only show if within 2 of the milestone (recently crossed)
    if (totalReports - latest > 2) return null
    return latest
  }, [totalReports])

  if (!milestone) return null

  return (
    <div className="px-4 py-3 border-b border-border/40">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/25 backdrop-blur-md shadow-depth-1 glass-sheen">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold">
            {milestone}回通過達成！
          </p>
          <p className="text-xs text-muted-foreground">
            {milestone >= 100
              ? '伝説の探索者として名が知られています'
              : milestone >= 50
                ? 'ベテラン探索者の風格が漂います'
                : milestone >= 25
                  ? '順調に探索経験を積んでいます'
                  : milestone >= 10
                    ? 'もう立派な探索者です'
                    : '探索の旅が始まりました！'}
          </p>
        </div>
      </div>
    </div>
  )
}
