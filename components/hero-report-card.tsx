'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { Calendar, Sparkles, Users as UsersIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shimmer } from '@/components/ui/shimmer'
import { cn } from '@/lib/utils'
import type { PlayReport } from '@/lib/types'

interface HeroReportCardProps {
  report: PlayReport
  /** Small label shown above the title (e.g. "あなたの最新の通過"). */
  eyebrow?: string
}

/**
 * Big "wallet" style hero card for the most recent report.
 * Uses parallax tilt + cover image + soft glow to make a single card feel prized.
 */
export function HeroReportCard({ report, eyebrow = 'あなたの最新の通過' }: HeroReportCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLAnchorElement>(null)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 180, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 180, damping: 20 })

  function handleMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (prefersReducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  function handleLeave() {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  const participantCount = report.participants?.length || 0

  return (
    <div className="px-4 py-4 border-b border-border/40" style={{ perspective: 1200 }}>
      <Link
        ref={ref}
        href={`/reports/${report.id}`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="group block"
      >
        <motion.div
          style={{
            rotateX: prefersReducedMotion ? 0 : rotateX,
            rotateY: prefersReducedMotion ? 0 : rotateY,
            transformStyle: 'preserve-3d',
          }}
          className={cn(
            'relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 backdrop-blur-xl glass-sheen',
            'shadow-depth-2',
            'transition-[box-shadow,border-color] duration-300',
            'hover:shadow-depth-3 hover:border-primary/30',
          )}
        >
          {/* Cover image or gradient placeholder */}
          <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-muted/60 via-muted to-background overflow-hidden">
            {report.cover_image_url ? (
              <Image
                src={report.cover_image_url}
                alt={report.scenario_name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 600px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Shimmer color="rgba(255,255,255,0.18)" duration="2.4s" />
            </div>

            {/* Eyebrow pill */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md border border-white/10 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>{eyebrow}</span>
            </div>

            {/* Title + meta overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h2 className="text-xl sm:text-2xl font-bold leading-snug line-clamp-2 drop-shadow-md">
                {report.scenario_name}
              </h2>
              {report.scenario_author && (
                <p className="text-xs text-white/80 mt-1 line-clamp-1">
                  {report.scenario_author}
                </p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 min-w-0">
              {report.profile && (
                <Avatar className="w-8 h-8 rounded-lg shrink-0">
                  <AvatarImage
                    src={report.profile.avatar_url || undefined}
                    className="rounded-lg"
                  />
                  <AvatarFallback className="text-xs rounded-lg">
                    {(report.profile.display_name || report.profile.username)
                      ?.charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {report.profile?.display_name || report.profile?.username}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(report.play_date_start)}
                  </span>
                  {participantCount > 0 && (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      {participantCount}名
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  )
}

/** Friendly placeholder when the user has no reports yet. */
export function HeroReportCardEmpty() {
  return (
    <div className="px-4 py-4 border-b border-border/50">
      <Link href="/reports/new" className="group block">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/50',
            'aspect-[16/9] flex flex-col items-center justify-center gap-2 text-center p-6',
            'transition-colors duration-300 hover:border-primary/50 hover:bg-card',
          )}
        >
          <Sparkles className="w-8 h-8 text-primary/70" />
          <p className="text-sm font-medium">最初の通過を記録しよう</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            セッションの記憶はあなたの財産。ここに大切に残していきます。
          </p>
        </div>
      </Link>
    </div>
  )
}
