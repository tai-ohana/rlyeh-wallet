'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Users, Clock, TrendingUp, Percent, Calendar, User2, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { ScenarioStats, ScenarioKpStat, PlayReport } from '@/lib/types'

interface Props {
  stats: ScenarioStats
  kpStats: ScenarioKpStat[]
  recentReports: PlayReport[]
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes === 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const RESULT_CONFIG: Record<string, { label: string; icon: React.ReactNode; style: string }> = {
  success: {
    label: '生還',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    style: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  },
  failure: {
    label: '失敗',
    icon: <XCircle className="w-3.5 h-3.5" />,
    style: 'text-red-400 bg-red-500/15 border-red-500/30',
  },
  other: {
    label: 'その他',
    icon: <MinusCircle className="w-3.5 h-3.5" />,
    style: 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30',
  },
}

function StatBlock({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-card/60 border border-border/40">
      <div className="text-muted-foreground/60">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function ScenarioDetailClient({ stats, kpStats, recentReports }: Props) {
  const result = stats.success_rate !== null
    ? stats.success_rate >= 50 ? '生還率高め' : '難易度高め'
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/scenarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        シナリオDB
      </Link>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-border/40 bg-zinc-900">
        {/* Background blur */}
        {stats.cover_image_url && (
          <div className="absolute inset-0">
            <Image src={stats.cover_image_url} alt="" fill className="object-cover blur-2xl opacity-20 scale-110" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative flex items-start gap-5 p-6">
          {/* Cover thumb */}
          <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/40">
            {stats.cover_image_url ? (
              <Image src={stats.cover_image_url} alt={stats.scenario_name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-zinc-800">
                <BookOpen className="w-7 h-7 text-white/20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pb-1 space-y-2 min-w-0">
            {result && (
              <span className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
                {result}
              </span>
            )}
            <h1 className="text-2xl font-bold text-white leading-tight break-all">{stats.scenario_name}</h1>
            {stats.scenario_author && (
              <p className="text-sm text-white/50">著: {stats.scenario_author}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
              {stats.first_played_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  初回: {formatDate(stats.first_played_at)}
                </span>
              )}
              {stats.last_played_at && (
                <span className="flex items-center gap-1">
                  最終: {formatDate(stats.last_played_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock
          label="総セッション"
          value={stats.total_sessions}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatBlock
          label="ユニークPL"
          value={`${stats.unique_reporters}人`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatBlock
          label="生還率"
          value={stats.success_rate !== null ? `${stats.success_rate}%` : '—'}
          icon={<Percent className="w-4 h-4" />}
        />
        <StatBlock
          label="平均プレイ時間"
          value={formatDuration(stats.avg_duration)}
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* KP 一覧 */}
      {kpStats.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <User2 className="w-4 h-4 text-muted-foreground" />
              KP 一覧
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kpStats.map(kp => (
                kp.username ? (
                  <Link key={kp.username} href={`/user/${kp.username}`}>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-accent transition-colors">
                      <Avatar className="w-8 h-8 rounded-lg shrink-0">
                        <AvatarImage src={kp.avatar_url || undefined} className="rounded-lg" />
                        <AvatarFallback className="rounded-lg text-[11px]">
                          {(kp.display_name || kp.username).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{kp.display_name || kp.username}</p>
                        <p className="text-[11px] text-muted-foreground">{kp.run_count}回開催</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div key={`anon-${kp.run_count}`} className="flex items-center gap-2.5 p-2.5">
                    <Avatar className="w-8 h-8 rounded-lg shrink-0">
                      <AvatarFallback className="rounded-lg text-[11px]">?</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-muted-foreground">未登録ユーザー</p>
                      <p className="text-[11px] text-muted-foreground">{kp.run_count}回</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近のプレイ記録 */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          最近のプレイ記録
        </h2>

        {recentReports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            公開されているプレイ記録はありません
          </div>
        ) : (
          <div className="space-y-2">
            {recentReports.map(report => {
              const resultCfg = report.result ? RESULT_CONFIG[report.result] : null
              const author = report.profile

              return (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40 hover:border-border/70 transition-colors">
                    {/* Cover */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                      {report.cover_image_url ? (
                        <Image src={report.cover_image_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Author */}
                      {author && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Avatar className="w-4 h-4 rounded-sm">
                            <AvatarImage src={author.avatar_url || undefined} className="rounded-sm" />
                            <AvatarFallback className="text-[9px] rounded-sm">
                              {(author.display_name || author.username).slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {author.display_name || author.username}
                          </span>
                        </div>
                      )}
                      {report.impression && (
                        <p className="text-xs text-muted-foreground/70 line-clamp-1">{report.impression}</p>
                      )}
                      {report.play_date_start && (
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                          {formatDate(report.play_date_start)}
                        </p>
                      )}
                    </div>

                    {/* Result */}
                    {resultCfg && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${resultCfg.style}`}>
                        {resultCfg.icon}
                        {resultCfg.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA for non-logged-in */}
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 text-center space-y-3">
        <p className="text-sm font-medium">このシナリオを通過した？記録を残してみよう</p>
        <p className="text-xs text-muted-foreground">R&apos;lyeh Wallet に記録すると、シナリオDBの統計に貢献できます。</p>
        <Link href="/auth/sign-up">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            無料で始める
          </button>
        </Link>
      </div>
    </div>
  )
}
