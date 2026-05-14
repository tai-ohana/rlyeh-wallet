'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Calendar, Clock, BookOpen, Loader2, Sparkles, Users, MessageCircle, Share, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PlayReport } from '@/lib/types'
import { ReportTagDisplay } from '@/components/report-tag-input'

interface FeedCardProps {
  report: PlayReport
  source?: 'friend' | 'following' | 'recommended'
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  if (diffWeek < 5) return `${diffWeek}週間前`
  if (diffMonth < 12) return `${diffMonth}ヶ月前`

  const d = new Date(dateString)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

// Gradient placeholders for reports without a cover image
const GRADIENTS = [
  'from-violet-900/80 via-indigo-900/60 to-slate-900',
  'from-rose-900/80 via-pink-900/60 to-slate-900',
  'from-emerald-900/80 via-teal-900/60 to-slate-900',
  'from-amber-900/80 via-orange-900/60 to-slate-900',
  'from-sky-900/80 via-blue-900/60 to-slate-900',
  'from-fuchsia-900/80 via-purple-900/60 to-slate-900',
]

function gradientForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

export function FeedCard({ report, source }: FeedCardProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(report.likes_count || 0)
  const [hasLiked, setHasLiked] = useState(report.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (isLiking) return
    setIsLiking(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('いいねするにはログインが必要です')
      setIsLiking(false)
      return
    }

    try {
      if (hasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('play_report_id', report.id)
          .eq('user_id', user.id)

        setLikesCount(prev => Math.max(0, prev - 1))
        setHasLiked(false)
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ play_report_id: report.id, user_id: user.id })

        if (error && error.code !== '23505') throw error

        setLikesCount(prev => prev + 1)
        setHasLiked(true)

        if (report.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: report.user_id,
            type: 'like',
            from_user_id: user.id,
            play_report_id: report.id,
          })
        }
      }
    } catch (error) {
      console.error('Like error:', error)
      toast.error('エラーが発生しました')
    } finally {
      setIsLiking(false)
    }
  }

  const profile = report.profile
  const gradient = gradientForId(report.id)

  return (
    <div className="group border-b border-border/50">
      {/* Recommended badge */}
      {source === 'recommended' && (
        <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground">おすすめ</span>
        </div>
      )}

      <Link href={`/reports/${report.id}`} className="block">
        <article className="hover:bg-accent/30 transition-colors">
          {/* ── Author row ── */}
          {profile && (
            <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/user/${profile.username}`)
                }}
                className="shrink-0"
              >
                <Avatar className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(profile.display_name || profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex items-center gap-1.5 min-w-0 text-sm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/user/${profile.username}`)
                  }}
                  className="font-semibold truncate hover:underline"
                >
                  {profile.display_name || profile.username}
                </button>
                <span className="text-muted-foreground truncate text-xs">@{profile.username}</span>
                <span className="text-muted-foreground text-xs shrink-0">·</span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatRelativeTime(report.created_at)}
                </span>
              </div>
            </div>
          )}

          {/* ── Cover image (full-width, natural aspect ratio) ── */}
          <div className="relative w-full overflow-hidden bg-muted/20">
            {report.cover_image_url ? (
              <Image
                src={report.cover_image_url}
                alt={report.scenario_name}
                width={800}
                height={600}
                className="w-full h-auto object-cover"
                sizes="(max-width: 640px) 100vw, 600px"
                unoptimized
              />
            ) : (
              /* Gradient placeholder with scenario name */
              <div className={cn(
                'w-full aspect-[16/9] bg-gradient-to-br flex flex-col items-center justify-center gap-3 px-6',
                gradient,
              )}>
                <p className="text-white/90 text-lg font-bold text-center leading-snug drop-shadow-lg line-clamp-3">
                  {report.scenario_name}
                </p>
                {report.scenario_author && (
                  <p className="text-white/60 text-sm text-center">
                    {report.scenario_author}
                  </p>
                )}
              </div>
            )}

            {/* Scenario name overlay (only when there's a cover image) */}
            {report.cover_image_url && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-10 pb-3">
                <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-2">
                  {report.scenario_name}
                </h3>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="px-4 pt-2.5 pb-1 space-y-2">
            {/* Scenario name (no-image case, already shown in placeholder; shown here too for consistency) */}
            {!report.cover_image_url && (
              <h3 className="text-[15px] font-semibold leading-snug">
                {report.scenario_name}
              </h3>
            )}

            {/* Meta chips */}
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
              {report.scenario_author && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 shrink-0" />
                  {report.scenario_author}
                </span>
              )}
              {report.edition && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {report.edition}
                </Badge>
              )}
              {report.play_duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {report.play_duration}h
                </span>
              )}
              {report.play_date_start && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {new Date(report.play_date_start).toLocaleDateString('ja-JP')}
                </span>
              )}
            </div>

            {/* Impression */}
            {report.impression && (
              <p className="text-[14px] text-foreground/80 line-clamp-2 leading-relaxed">
                {report.impression}
              </p>
            )}

            {/* Participants */}
            {report.participants && report.participants.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {report.participants.map((p, idx) => {
                  const isTagged = p.user_id && p.username?.startsWith('@')
                  const participantProfile = p.profile
                  const displayName = isTagged && participantProfile
                    ? (participantProfile.display_name || participantProfile.username)
                    : (isTagged ? p.username.slice(1) : p.username)

                  return (
                    <span key={p.id || idx} className="inline-flex items-center">
                      {idx > 0 && <span className="text-muted-foreground/40 mr-1">,</span>}
                      {isTagged ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const uname = participantProfile?.username || p.username.slice(1)
                            router.push(`/user/${uname}`)
                          }}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Avatar className="w-4 h-4 rounded-full">
                            <AvatarImage src={participantProfile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{displayName}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[9px] px-1 py-0 h-3.5 leading-none',
                              p.role === 'KP' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                            )}
                          >
                            {p.role}
                          </Badge>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{displayName}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[9px] px-1 py-0 h-3.5 leading-none',
                              p.role === 'KP' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                            )}
                          >
                            {p.role}
                          </Badge>
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <ReportTagDisplay tags={report.tags} maxDisplay={3} />
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-0 px-3 pb-2 -mt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              disabled
            >
              <MessageCircle className="h-[17px] w-[17px]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-full gap-1.5 hover:bg-red-500/10 hover:text-red-500"
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="h-[17px] w-[17px] animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    'h-[17px] w-[17px] transition-all',
                    hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              )}
              {likesCount > 0 && (
                <span className={cn('text-[13px]', hasLiked ? 'text-red-500' : 'text-muted-foreground')}>
                  {likesCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              disabled
            >
              <Bookmark className="h-[17px] w-[17px]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              disabled
            >
              <Share className="h-[17px] w-[17px]" />
            </Button>
          </div>
        </article>
      </Link>
    </div>
  )
}
