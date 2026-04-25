'use client'

import React, { Suspense, useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, User, BookOpen, Loader2, LayoutGrid, List, UserPlus, UserCheck, Clock, Star, Tag, TrendingUp, Users, KeyRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SessionCard, SessionCardGrid } from '@/components/session-card'
import { toast } from 'sonner'
import type { PlayReport, Profile } from '@/lib/types'
import { getProfileLimits } from '@/lib/tier-limits'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="h-12 w-full bg-muted animate-pulse rounded" />
    </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'streamers' ? 'streamers' : 'search'

  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<{
    reports: PlayReport[]
    users: Profile[]
  }>({ reports: [], users: [] })
  const [hasSearched, setHasSearched] = useState(false)
  const [streamers, setStreamers] = useState<Profile[]>([])
  const [loadingStreamers, setLoadingStreamers] = useState(false)

  // Tag search state
  const [tagQuery, setTagQuery] = useState('')
  const [tagSearchResults, setTagSearchResults] = useState<PlayReport[]>([])
  const [hasTagSearched, setHasTagSearched] = useState(false)
  const [popularTags, setPopularTags] = useState<{ tag_name: string; count: number }[]>([])

  // Filter state
  const [edition, setEdition] = useState<string>('all')
  const [result, setResult] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Discovery state (shown before search)
  const [discoveryReports, setDiscoveryReports] = useState<PlayReport[]>([])
  const [discoveryKPs, setDiscoveryKPs] = useState<Profile[]>([])
  const [discoveryLoading, setDiscoveryLoading] = useState(true)

  useEffect(() => {
    async function loadDiscovery() {
      const supabase = createClient()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Popular recent reports
      const { data: reports } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
          participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
          likes:likes(id)
        `)
        .eq('privacy_setting', 'public')
        .eq('is_mini', false)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(8)

      setDiscoveryReports((reports || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 })) as PlayReport[])

      // Active KPs (recent KP participants)
      const { data: kpParticipants } = await supabase
        .from('play_report_participants')
        .select('user_id')
        .eq('role', 'KP')
        .not('user_id', 'is', null)
        .limit(30)

      const kpIds = [...new Set((kpParticipants || []).map(p => p.user_id).filter(Boolean))] as string[]
      if (kpIds.length > 0) {
        const { data: kpProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', kpIds.slice(0, 6))

        setDiscoveryKPs(kpProfiles || [])
      }

      setDiscoveryLoading(false)
    }
    loadDiscovery()
    loadPopularTags()
  }, [])


  // Load popular tags
  async function loadPopularTags() {
    const supabase = createClient()

    // Get most used tags (simple count approach)
    const { data } = await supabase
      .from('report_tags')
      .select('tag_name')
      .limit(100)

    if (data) {
      // Count occurrences
      const tagCounts: Record<string, number> = {}
      for (const tag of data) {
        tagCounts[tag.tag_name] = (tagCounts[tag.tag_name] || 0) + 1
      }

      // Sort by count and take top 10
      const sortedTags = Object.entries(tagCounts)
        .map(([tag_name, count]) => ({ tag_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setPopularTags(sortedTags)
    }
  }

  // Tag search function
  function handleTagSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!tagQuery.trim()) return

    startTransition(async () => {
      const supabase = createClient()

      // Search reports by tag name
      const { data: tagMatches } = await supabase
        .from('report_tags')
        .select('play_report_id')
        .ilike('tag_name', `%${tagQuery}%`)

      if (tagMatches && tagMatches.length > 0) {
        const reportIds = tagMatches.map(t => t.play_report_id)

        const { data: reports } = await supabase
          .from('play_reports')
          .select(`
            *,
            profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url),
            participants:play_report_participants(*),
            tags:report_tags(*)
          `)
          .eq('privacy_setting', 'public')
          .in('id', reportIds)
          .order('play_date_start', { ascending: false })
          .limit(30)

        setTagSearchResults(reports || [])
      } else {
        setTagSearchResults([])
      }
      setHasTagSearched(true)
    })
  }

  // Search by clicking a popular tag
  function searchByTag(tagName: string) {
    setTagQuery(tagName)
    startTransition(async () => {
      const supabase = createClient()

      const { data: tagMatches } = await supabase
        .from('report_tags')
        .select('play_report_id')
        .eq('tag_name', tagName)

      if (tagMatches && tagMatches.length > 0) {
        const reportIds = tagMatches.map(t => t.play_report_id)

        const { data: reports } = await supabase
          .from('play_reports')
          .select(`
            *,
            profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url),
            participants:play_report_participants(*),
            tags:report_tags(*)
          `)
          .eq('privacy_setting', 'public')
          .in('id', reportIds)
          .order('play_date_start', { ascending: false })
          .limit(30)

        setTagSearchResults(reports || [])
      } else {
        setTagSearchResults([])
      }
      setHasTagSearched(true)
    })
  }

  // Load streamers when tab changes
  async function loadStreamers() {
    setLoadingStreamers(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tier', 'streamer')
      .order('display_name', { ascending: true })
      .limit(50)

    setStreamers(data || [])
    setLoadingStreamers(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    startTransition(async () => {
      const supabase = createClient()

      // Build query for reports
      let reportsQuery = supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url),
          participants:play_report_participants(*),
          tags:report_tags(*)
        `)
        .eq('privacy_setting', 'public')
        .or(`scenario_name.ilike.%${query}%,scenario_author.ilike.%${query}%`)

      // Apply filters
      if (edition !== 'all') {
        reportsQuery = reportsQuery.eq('edition', edition)
      }
      if (result !== 'all') {
        reportsQuery = reportsQuery.eq('result', result)
      }

      // Apply sorting
      if (sortBy === 'date_desc') {
        reportsQuery = reportsQuery.order('play_date_start', { ascending: false })
      } else if (sortBy === 'date_asc') {
        reportsQuery = reportsQuery.order('play_date_start', { ascending: true })
      } else if (sortBy === 'name_asc') {
        reportsQuery = reportsQuery.order('scenario_name', { ascending: true })
      }

      const { data: reports } = await reportsQuery.limit(30)

      // Search users by username or display_name
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10)

      setSearchResults({
        reports: reports || [],
        users: users || [],
      })
      setHasSearched(true)
    })
  }



  return (
    <div className="space-y-6 transition-[padding] duration-300 ease-out" style={{ paddingLeft: 'calc(var(--sidebar-w, 68px) - 68px)' }}>
      {/* Header — visionOS hero */}
      <div className="rounded-3xl glass glass-sheen shadow-depth-1 px-6 py-5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">検索</h1>
        <p className="text-muted-foreground text-sm mt-0.5">シナリオ、ユーザー、配信者を検索</p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6" onValueChange={(v) => {
        if (v === 'streamers' && streamers.length === 0) {
          loadStreamers()
        }
        if (v === 'tag-search' && popularTags.length === 0) {
          loadPopularTags()
        }
      }}>
        <TabsList className="bg-card/50">
          <TabsTrigger value="search" className="gap-2">
            <Search className="w-4 h-4" />
            検索
          </TabsTrigger>
          <TabsTrigger value="tag-search" className="gap-2">
            <Tag className="w-4 h-4" />
            タグ
          </TabsTrigger>
          <TabsTrigger value="streamers" className="gap-2">
            <Star className="w-4 h-4" />
            配信者
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Form + Filters (always visible, unified with wallet) */}
          <form onSubmit={handleSearch}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="シナリオ名、作者名、ユーザー名で検索..."
                  className="pl-10"
                  disabled={isPending}
                />
              </div>

              <Select value={edition} onValueChange={setEdition}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="システム" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全システム</SelectItem>
                  <SelectItem value="coc6">CoC 6版</SelectItem>
                  <SelectItem value="coc7">CoC 7版</SelectItem>
                  <SelectItem value="new-cthulhu">新クトゥルフ</SelectItem>
                  <SelectItem value="delta-green">Delta Green</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>

              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="結果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failure">失敗</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="並び順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">新しい順</SelectItem>
                  <SelectItem value="date_asc">古い順</SelectItem>
                  <SelectItem value="name_asc">名前順</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none h-9 w-9"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none h-9 w-9"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button type="submit" disabled={isPending || !query.trim()}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '検索'
                )}
              </Button>
            </div>
          </form>

          {/* Discovery — shown before any search */}
          {!hasSearched && (
            <div className="space-y-8">
              {/* Popular reports */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  最近の記録
                </h2>
                {discoveryLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SessionCardGrid columns={4}>
                    {discoveryReports.map(report => (
                      <SessionCard key={report.id} report={report} showAuthor />
                    ))}
                  </SessionCardGrid>
                )}
              </div>

              {/* Active KPs */}
              {!discoveryLoading && discoveryKPs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    KP経験者
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {discoveryKPs.map(kp => (
                      <Link key={kp.id} href={`/user/${kp.username}`}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50 hover:border-primary/40 hover:bg-accent transition-colors">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={kp.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(kp.display_name || kp.username)?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{kp.display_name || kp.username}</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600">KP</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular tags */}
              {popularTags.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    人気タグ
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <button
                        key={tag.tag_name}
                        type="button"
                        onClick={() => {
                          setQuery(tag.tag_name)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:border-primary/40 hover:bg-accent text-sm transition-colors"
                      >
                        <span>#{tag.tag_name}</span>
                        <span className="text-xs text-muted-foreground">{tag.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {hasSearched && (
            <div className="space-y-6">
              {/* Users */}
              {searchResults.users.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    ユーザー
                  </h2>
                  <div className="grid gap-3">
                    {searchResults.users.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {/* Reports */}
              {searchResults.reports.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    セッション記録 ({searchResults.reports.length}件)
                  </h2>
                  {viewMode === 'grid' ? (
                    <SessionCardGrid columns={4}>
                      {searchResults.reports.map(report => (
                        <SessionCard
                          key={report.id}
                          report={report}
                          showAuthor
                        />
                      ))}
                    </SessionCardGrid>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.reports.map(report => (
                        <SessionCard
                          key={report.id}
                          report={report}
                          showAuthor
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {searchResults.users.length === 0 && searchResults.reports.length === 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">検索結果が見つかりませんでした</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      別のキーワードで検索してみてください
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tag-search" className="space-y-6">
          {/* Tag Search Form */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                タグで検索
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleTagSearch} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  卓名、何陣目、シナリオ略称などのタグで記録を検索できます
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={tagQuery}
                      onChange={(e) => setTagQuery(e.target.value)}
                      placeholder="タグを入力..."
                      className="pl-10"
                      disabled={isPending}
                    />
                  </div>
                  <Button type="submit" disabled={isPending || !tagQuery.trim()}>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '検索'
                    )}
                  </Button>
                </div>
              </form>

              {/* Popular Tags */}
              {popularTags.length > 0 && !hasTagSearched && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">よく使われているタグ</p>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <button
                        key={tag.tag_name}
                        type="button"
                        onClick={() => searchByTag(tag.tag_name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        {tag.tag_name}
                        <span className="text-xs text-muted-foreground">({tag.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Search Results */}
          {hasTagSearched && (
            <div className="space-y-3">
              {tagSearchResults.length > 0 ? (
                <>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    検索結果 ({tagSearchResults.length}件)
                  </h2>
                  <SessionCardGrid columns={4}>
                    {tagSearchResults.map(report => (
                      <SessionCard
                        key={report.id}
                        report={report}
                        showAuthor
                      />
                    ))}
                  </SessionCardGrid>
                </>
              ) : (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Tag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">タグが見つかりませんでした</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      別のタグで検索してみてください
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>



        <TabsContent value="streamers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                配信者一覧
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                配信者ティアのユーザーをフォローすると、ダッシュボードで最新の投稿を確認できます
              </p>
            </div>
          </div>

          {loadingStreamers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : streamers.length > 0 ? (
            <div className="grid gap-3">
              {streamers.map((streamer) => (
                <StreamerCard key={streamer.id} user={streamer} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <Star className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">配信者がまだ登録されていません</p>
                <p className="text-sm text-muted-foreground mt-1">
                  配信者ティアに登録すると、ここに表示されます
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserCard({ user }: { user: Profile }) {
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends' | 'loading'>('loading')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkFriendStatus() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser || currentUser.id === user.id) {
        setFriendStatus('none')
        return
      }

      setCurrentUserId(currentUser.id)

      // Check if already friends (mutual follows)
      const { data: iFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
        .maybeSingle()

      const { data: theyFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', currentUser.id)
        .maybeSingle()

      console.log('[v0] Friend check for', user.username, '- iFollow:', !!iFollow, 'theyFollow:', !!theyFollow)

      if (iFollow && theyFollow) {
        setFriendStatus('friends')
        return
      }

      // Check if request pending
      const { data: request } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${user.id}),and(from_user_id.eq.${user.id},to_user_id.eq.${currentUser.id})`)
        .eq('status', 'pending')
        .maybeSingle()

      console.log('[v0] Pending request:', request)

      if (request) {
        setFriendStatus('pending')
        return
      }

      setFriendStatus('none')
      console.log('[v0] Setting friend status to none for', user.username)
    }

    checkFriendStatus()
  }, [user.id])

  async function sendFriendRequest(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) return

    const supabase = createClient()

    // Get current user profile for tier limits
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    const limits = getProfileLimits(currentProfile)

    // Check follow count against limit
    const { count: followCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId)

    if ((followCount || 0) >= limits.maxFollows) {
      toast.error(`フォロー上限（${limits.maxFollows}人）に達しています。Proプランにアップグレードすると上限が500人になります。`)
      return
    }

    // Check for existing request (any status)
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${user.id}),and(from_user_id.eq.${user.id},to_user_id.eq.${currentUserId})`)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        toast.info('既に申請中です')
        setFriendStatus('pending')
        return
      }

      // If rejected, update the existing request to pending
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({
          status: 'pending',
          from_user_id: currentUserId,
          to_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id)

      if (updateError) {
        toast.error('フレンド申請に失敗しました')
        return
      }
    } else {
      // Create new friend request
      const { error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: currentUserId,
          to_user_id: user.id,
          status: 'pending'
        })

      if (requestError) {
        toast.error('フレンド申請に失敗しました')
        return
      }
    }

    // Create notification for the recipient
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'friend_request',
        from_user_id: currentUserId,
      })

    setFriendStatus('pending')
    toast.success('フレンド申請を送信しました')
  }

  return (
    <Link href={`/user/${user.username}`}>
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-xl">
                <AvatarImage src={user.avatar_url || undefined} className="rounded-xl" />
                <AvatarFallback className="bg-primary/20 text-primary rounded-xl">
                  {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.display_name || user.username}</p>
                  {user.tier === 'streamer' && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      配信者
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            {currentUserId && currentUserId !== user.id && (
              <div onClick={(e) => e.preventDefault()}>
                {friendStatus === 'loading' ? (
                  <Button variant="ghost" size="sm" disabled className="bg-transparent">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Button>
                ) : friendStatus === 'friends' ? (
                  <Button variant="ghost" size="sm" disabled className="gap-2 text-green-600 bg-transparent">
                    <UserCheck className="w-4 h-4" />
                    フレンド
                  </Button>
                ) : friendStatus === 'pending' ? (
                  <Button variant="ghost" size="sm" disabled className="gap-2 text-amber-600 bg-transparent">
                    <Clock className="w-4 h-4" />
                    申請中
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendFriendRequest}
                    className="gap-2 bg-transparent"
                  >
                    <UserPlus className="w-4 h-4" />
                    フレンド申請
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StreamerCard({ user }: { user: Profile }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkFollowStatus() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser || currentUser.id === user.id) {
        setLoading(false)
        return
      }

      setCurrentUserId(currentUser.id)

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
        .maybeSingle()

      setIsFollowing(!!data)
      setLoading(false)
    }

    checkFollowStatus()
  }, [user.id])

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) return

    setLoading(true)
    const supabase = createClient()

    if (isFollowing) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', user.id)

      setIsFollowing(false)
      toast.success('フォローを解除しました')
    } else {
      // Check follow limit
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      const limits = getProfileLimits(currentProfile)

      const { count: followCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUserId)

      if ((followCount || 0) >= limits.maxFollows) {
        toast.error(`フォロー上限（${limits.maxFollows}人）に達しています。Proプランにアップグレードすると上限が500人になります。`)
        setLoading(false)
        return
      }

      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: user.id
        })

      if (error) {
        toast.error('フォローに失敗しました')
      } else {
        setIsFollowing(true)
        toast.success('フォローしました')
      }
    }

    setLoading(false)
  }

  return (
    <Link href={`/user/${user.username}`}>
      <Card className="bg-card/50 border-border/50 hover:border-purple-500/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 rounded-xl ring-2 ring-purple-500/30">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-500">
                    {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Star className="absolute -bottom-1 -right-1 w-4 h-4 text-purple-500 fill-purple-500" />
              </div>
              <div>
                <p className="font-medium">{user.display_name || user.username}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-xs">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {currentUserId && currentUserId !== user.id && (
              <div onClick={(e) => e.preventDefault()}>
                {loading ? (
                  <Button variant="ghost" size="sm" disabled className="bg-transparent">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Button>
                ) : isFollowing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFollow}
                    className="gap-2 text-purple-600 bg-transparent hover:text-purple-700"
                  >
                    <UserCheck className="w-4 h-4" />
                    フォロー中
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={toggleFollow}
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    フォロー
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
