'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart, Calendar, Edit3, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PlayReport } from '@/lib/types'
import { ReportTagDisplay } from '@/components/report-tag-input'
import { fadeInUp, staggerContainer } from '@/lib/motion'

interface SessionCardProps {
  report: PlayReport
  showAuthor?: boolean
  showEdit?: boolean
  compact?: boolean
  isFavorite?: boolean
}

export function SessionCard({
  report,
  showAuthor = false,
  showEdit = false,
  compact = false,
  isFavorite = false
}: SessionCardProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(report.likes_count || 0)
  const [hasLiked, setHasLiked] = useState(report.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

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
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('play_report_id', report.id)
          .eq('user_id', user.id)

        setLikesCount(prev => Math.max(0, prev - 1))
        setHasLiked(false)
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            play_report_id: report.id,
            user_id: user.id
          })

        if (error && error.code !== '23505') { // Ignore duplicate key error
          throw error
        }

        setLikesCount(prev => prev + 1)
        setHasLiked(true)

        // Create notification for report owner if different from current user
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

  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="group break-inside-avoid mb-6"
      variants={fadeInUp}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link href={`/reports/${report.id}`} className="block">
        {/* Card Container */}
        <div className={cn(
          "relative overflow-hidden rounded-3xl glass-sheen",
          "bg-card/80 backdrop-blur-xl border",
          isFavorite
            ? "border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20"
            : report.is_mini
              ? "border-dashed border-border/60"
              : "border-border/40",
          "shadow-depth-1",
          "transition-[transform,box-shadow,border-color] duration-300 ease-out",
          "hover:shadow-depth-3 hover:border-primary/30"
        )}>
          {/* Holofoil sheen — reveals on hover */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100",
              "transition-opacity duration-500",
              "bg-gradient-to-b from-primary/10 via-transparent to-transparent",
            )}
          />
          {/* Favorite star badge */}
          {isFavorite && (
            <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-6 h-6 rounded-full glass border border-amber-400/40 shadow-depth-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
          )}
          {/* Image wrapper — only shown when image exists */}
          {report.cover_image_url && (
            <div className="relative w-full bg-muted/30">
              <Image
                src={report.cover_image_url}
                alt={report.scenario_name}
                width={400}
                height={600}
                className="w-full h-auto"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Edit button overlay */}
              {showEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/reports/${report.id}/edit`)
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Edit button for cards without image */}
          {!report.cover_image_url && showEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/reports/${report.id}/edit`)
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-10"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Content area */}
          <div className="p-4 space-y-2.5">
            {/* Mini badge */}
            {report.is_mini && (
              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full glass border border-border/40 text-muted-foreground tracking-wide">
                ミニ
              </span>
            )}
            {/* Title */}
            <h3 className="font-medium text-sm leading-relaxed line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
              {report.scenario_name}
            </h3>

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <ReportTagDisplay tags={report.tags} maxDisplay={2} />
            )}

            {/* Participants (compact avatar stack) */}
            {report.participants && report.participants.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {report.participants.slice(0, 4).map((p, idx) => {
                    const isTagged = p.user_id && p.username?.startsWith('@')
                    const pProfile = p.profile
                    const displayChar = isTagged && pProfile
                      ? (pProfile.display_name || pProfile.username).charAt(0).toUpperCase()
                      : p.username.replace(/^@/, '').charAt(0).toUpperCase()

                    return isTagged && pProfile ? (
                      <Avatar key={p.id || idx} className="w-5 h-5 rounded-full border-2 border-card">
                        <AvatarImage src={pProfile.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">{displayChar}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar key={p.id || idx} className="w-5 h-5 rounded-full border-2 border-card">
                        <AvatarFallback className="text-[8px] bg-muted">{displayChar}</AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">
                  {report.participants.map(p => {
                    const isTagged = p.user_id && p.username?.startsWith('@')
                    const pProfile = p.profile
                    if (isTagged && pProfile) return pProfile.display_name || pProfile.username
                    return p.username.replace(/^@/, '')
                  }).slice(0, 2).join(', ')}
                  {report.participants.length > 2 && ` 他${report.participants.length - 2}名`}
                </span>
              </div>
            )}

            {/* Author / Profile */}
            {showAuthor && report.profile && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/user/${report.profile!.username}`)
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
              >
                <Avatar className="w-5 h-5 rounded-md">
                  <AvatarImage src={report.profile.avatar_url || undefined} className="rounded-md" />
                  <AvatarFallback className="text-[10px] rounded-md">
                    {(report.profile.display_name || report.profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {report.profile.display_name || report.profile.username}
                </span>
              </button>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {formatDate(report.play_date_start)}
              </span>

              {/* Like button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 -mr-2 rounded-full gap-1.5 hover:bg-rose-500/10"
                onClick={handleLike}
                disabled={isLiking}
              >
                {isLiking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <motion.span
                    key={hasLiked ? 'liked' : 'unliked'}
                    initial={false}
                    animate={hasLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex"
                  >
                    <Heart
                      className={cn(
                        'h-3.5 w-3.5 transition-colors',
                        hasLiked
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-muted-foreground hover:text-rose-400'
                      )}
                    />
                  </motion.span>
                )}
                {likesCount > 0 && (
                  <span className={cn(
                    "text-xs tabular-nums",
                    hasLiked ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {likesCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* Grid container with proper spacing */
export function SessionCardGrid({
  children,
  columns = 4
}: {
  children: React.ReactNode
  columns?: 3 | 4
}) {
  return (
    <motion.div
      variants={staggerContainer(0.035)}
      initial="hidden"
      animate="visible"
      className={cn(
        "gap-6",
        columns === 4
          ? "columns-2 md:columns-3 lg:columns-4"
          : "columns-2 md:columns-3"
      )}
    >
      {children}
    </motion.div>
  )
}
