'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { InvestigatorCard } from '@/components/investigator-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import type { Investigator, InvestigatorStatus } from '@/lib/types'

const STATUS_TABS: { value: 'all' | InvestigatorStatus; label: string }[] = [
  { value: 'all',      label: 'すべて' },
  { value: 'active',   label: '生存' },
  { value: 'lost',     label: 'ロスト' },
  { value: 'retired',  label: '引退' },
]

export default function InvestigatorsPage() {
  const [investigators, setInvestigators] = useState<(Investigator & { session_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | InvestigatorStatus>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('investigators')
        .select('*, sessions:investigator_sessions(count)')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (data) {
        const normalized = data.map((inv: Investigator & { sessions?: [{ count: number }] }) => ({
          ...inv,
          session_count: inv.sessions?.[0]?.count ?? 0,
        }))
        setInvestigators(normalized)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = investigators.filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter
    const matchQuery = query === '' || inv.name.includes(query) || inv.occupation?.includes(query)
    return matchStatus && matchQuery
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">探索者コレクション</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {investigators.length > 0
              ? `${investigators.length}人の探索者`
              : 'まだ探索者がいません'}
          </p>
        </div>
        <Link href="/investigators/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            追加
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1 opacity-60">
                  {investigators.filter(i => i.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-40 max-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="名前・職業で検索"
            className="pl-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          {investigators.length === 0 ? (
            <>
              <div className="text-5xl">🕵️</div>
              <p className="font-semibold">まだ探索者がいません</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                セッションを共にした探索者を登録して、思い出をコレクションしましょう
              </p>
              <Link href="/investigators/new">
                <Button className="mt-2 gap-2">
                  <Plus className="w-4 h-4" />
                  最初の探索者を追加
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">該当する探索者がいません</p>
              <button onClick={() => { setFilter('all'); setQuery('') }} className="text-xs text-primary underline">
                フィルターをリセット
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(inv => (
            <InvestigatorCard key={inv.id} investigator={inv} sessionCount={inv.session_count} />
          ))}
        </div>
      )}
    </div>
  )
}
