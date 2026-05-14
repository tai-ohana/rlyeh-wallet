'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BookOpen, Users, Clock, TrendingUp, Percent, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { ScenarioStats } from '@/lib/types'

interface Props {
  scenarios: ScenarioStats[]
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes === 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function ScenarioCard({ scenario }: { scenario: ScenarioStats }) {
  const slug = encodeURIComponent(scenario.scenario_name)

  return (
    <Link href={`/scenarios/${slug}`}>
      <div className="group relative flex flex-col rounded-2xl border border-border/40 bg-card/60 hover:border-border/80 hover:bg-card transition-all duration-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg">
        {/* Cover image or placeholder */}
        <div className="relative w-full aspect-[16/9] bg-muted/30 shrink-0">
          {scenario.cover_image_url ? (
            <Image
              src={scenario.cover_image_url}
              alt={scenario.scenario_name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/20" />
            </div>
          )}
          {/* Session count badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-semibold text-white">{scenario.total_sessions}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {scenario.scenario_name}
          </h3>
          {scenario.scenario_author && (
            <p className="text-xs text-muted-foreground/60 truncate">{scenario.scenario_author}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {scenario.unique_reporters}人
            </span>
            {scenario.success_rate !== null && (
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                生還{scenario.success_rate}%
              </span>
            )}
            {scenario.avg_duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(scenario.avg_duration)}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="absolute right-3 bottom-3.5 w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
      </div>
    </Link>
  )
}

export function ScenarioListClient({ scenarios }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'popular' | 'recent' | 'survival'>('popular')

  const filtered = useMemo(() => {
    let list = scenarios
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        s =>
          s.scenario_name.toLowerCase().includes(q) ||
          (s.scenario_author ?? '').toLowerCase().includes(q),
      )
    }
    switch (sort) {
      case 'popular':
        return [...list].sort((a, b) => b.total_sessions - a.total_sessions)
      case 'recent':
        return [...list].sort((a, b) =>
          (b.last_played_at ?? '').localeCompare(a.last_played_at ?? ''),
        )
      case 'survival':
        return [...list].sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    }
  }, [scenarios, query, sort])

  const sortTabs = [
    { key: 'popular' as const, label: '人気順' },
    { key: 'recent' as const, label: '最近' },
    { key: 'survival' as const, label: '生還率' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">シナリオDB</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          プレイヤーの記録から生まれたシナリオデータ — {scenarios.length}作品
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="シナリオ名・著者名で検索"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 bg-background/60"
          />
        </div>
        <div className="flex gap-1">
          {sortTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSort(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sort === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {query ? `「${query}」に一致するシナリオが見つかりません` : 'まだシナリオデータがありません'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(scenario => (
            <ScenarioCard key={scenario.scenario_name} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  )
}
