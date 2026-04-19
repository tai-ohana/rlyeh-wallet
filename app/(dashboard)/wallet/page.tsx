'use client'

import React from "react"

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Rss,
  ArrowUpDown,
  BookOpen,
  Users,
  Trophy,
  Clock,
  Loader2,
  FolderOpen,
  ArrowLeft,
  KeyRound,
  X,
  FileText,
  HelpCircle,
  Trash2
} from 'lucide-react'
import { WalletTimeline } from '@/components/wallet-timeline'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SessionCard, SessionCardGrid } from '@/components/session-card'
import {
  FolderCard,
  groupReportsIntoFolders,
  isVirtualFolder,
  isReportFolder,
  isPlayReport,
  type VirtualFolder,
  calculateFolderStats
} from '@/components/folder-card'
import { CreateFolderButton, ProFeatureIndicator } from '@/components/folder-manager'
import type { PlayReport, ReportFolder, Profile } from '@/lib/types'
import { getProfileLimits } from '@/lib/tier-limits'

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'
type FilterResult = 'all' | 'success' | 'failure'
type ViewMode = 'grid' | 'list' | 'timeline'

export default function WalletPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<PlayReport[]>([])
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [openFolder, setOpenFolder] = useState<VirtualFolder | ReportFolder | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [filterResult, setFilterResult] = useState<FilterResult>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    asKP: 0,
    asPL: 0,
    uniqueScenarios: 0,
    totalHours: 0,
    survivalRate: 0,
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get user profile for username matching and tier info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        setProfile(userProfile)
      }

      // Get user's folders (table may not exist yet)
      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('report_folders')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })

        if (!foldersError) {
          setFolders(foldersData || [])
        }
      } catch {
        // Table doesn't exist yet, ignore
        console.log('[v0] report_folders table not available')
      }

      // Get all reports created by the user
      const { data: allReports } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url),
          participants:play_report_participants(*)
        `)
        .eq('user_id', user.id)
        .order('play_date_start', { ascending: false })

      const myReportsData = allReports || []
      setMyReports(myReportsData)

      const totalSessions = myReportsData.length

      let asKP = 0
      let asPL = 0
      let surviveCount = 0
      let totalPLSessions = 0
      const countedReportIds = new Set<string>()

      // Helper to check if participant matches current user
      const isUserParticipant = (p: { user_id?: string | null; username?: string | null }) => {
        if (p.user_id === user.id) return true
        if (!userProfile) return false
        const username = p.username?.toLowerCase() || ''
        const userUsername = userProfile.username?.toLowerCase() || ''
        const userDisplayName = userProfile.display_name?.toLowerCase() || ''
        // Match @username format or display name
        return username === `@${userUsername}` ||
          username === userUsername ||
          (userDisplayName && username === userDisplayName)
      }

      // Count from own reports' participants
      myReportsData.forEach(report => {
        report.participants?.forEach(p => {
          if (isUserParticipant(p)) {
            const key = `${report.id}-${p.role}`
            if (!countedReportIds.has(key)) {
              countedReportIds.add(key)
              if (p.role === 'KP') asKP++
              if (p.role === 'PL') {
                asPL++
                const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
                if (p.result === 'survive' || isLost) {
                  totalPLSessions++
                  if (p.result === 'survive') surviveCount++
                }
              }
            }
          }
        })
      })

      // Also get participations in other people's reports
      const { data: allParticipations } = await supabase
        .from('play_report_participants')
        .select('play_report_id, role, result, user_id, username')

      allParticipations?.forEach(p => {
        if (isUserParticipant(p)) {
          const key = `${p.play_report_id}-${p.role}`
          if (!countedReportIds.has(key)) {
            countedReportIds.add(key)
            if (p.role === 'KP') asKP++
            if (p.role === 'PL') {
              asPL++
              const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
              if (p.result === 'survive' || isLost) {
                totalPLSessions++
                if (p.result === 'survive') surviveCount++
              }
            }
          }
        }
      })

      const uniqueScenarios = new Set(myReportsData.map(r => r.scenario_name)).size

      const totalHours = myReportsData.reduce((acc, r) => acc + (r.play_duration || 0), 0)

      const survivalRate = totalPLSessions > 0
        ? Math.round((surviveCount / totalPLSessions) * 100)
        : 0

      setStats({
        totalSessions,
        asKP,
        asPL,
        uniqueScenarios,
        totalHours,
        survivalRate,
      })

      setLoading(false)
    }

    loadData()
  }, [])

  // Delete folder handler
  async function handleDeleteFolder(folderId: string) {
    const supabase = createClient()

    // First, unassign all reports from this folder
    await supabase
      .from('play_reports')
      .update({ folder_id: null })
      .eq('folder_id', folderId)

    const { error } = await supabase
      .from('report_folders')
      .delete()
      .eq('id', folderId)

    if (error) {
      toast.error('フォルダの削除に失敗しました')
    } else {
      toast.success('フォルダを削除しました（中の記録はウォレットに残ります）')
      setFolders(folders.filter(f => f.id !== folderId))
      setOpenFolder(null)
      // Reload to reflect unassigned reports
      window.location.reload()
    }
  }

  // Group reports into folders (virtual for same scenario names, real for user-created)
  const groupedItems = useMemo(() => {
    return groupReportsIntoFolders(myReports, folders)
  }, [myReports, folders])

  // Check if user can use folders feature
  const canUseFolders = profile ? getProfileLimits(profile).canUseFolders : false

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    myReports.forEach(r => {
      if (r.play_date_start) {
        years.add(new Date(r.play_date_start).getFullYear().toString())
      }
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [myReports])

  // Filter and sort function - works with both flat and folder views
  const filteredReports = useMemo(() => {
    // If viewing a folder, filter those reports
    const reportsToFilter = openFolder && 'reports' in openFolder
      ? openFolder.reports
      : myReports

    let filtered = [...reportsToFilter]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.scenario_name.toLowerCase().includes(query) ||
        r.scenario_author?.toLowerCase().includes(query)
      )
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(r =>
        r.play_date_start && new Date(r.play_date_start).getFullYear().toString() === filterYear
      )
    }

    // Result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(r => r.result === filterResult)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.play_date_start).getTime() - new Date(a.play_date_start).getTime()
        case 'date_asc':
          return new Date(a.play_date_start).getTime() - new Date(b.play_date_start).getTime()
        case 'name_asc':
          return a.scenario_name.localeCompare(b.scenario_name, 'ja')
        case 'name_desc':
          return b.scenario_name.localeCompare(a.scenario_name, 'ja')
        default:
          return 0
      }
    })

    return filtered
  }, [myReports, openFolder, searchQuery, filterYear, filterResult, sortBy])

  // Filtered grouped items (for folder view)
  const filteredGroupedItems = useMemo(() => {
    if (!searchQuery && filterYear === 'all' && filterResult === 'all') {
      return groupedItems
    }

    // When filtering, show flat list instead of folders
    return filteredReports
  }, [groupedItems, filteredReports, searchQuery, filterYear, filterResult])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header — visionOS hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl glass glass-sheen shadow-depth-1 px-6 py-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Wallet</h1>
          <p className="text-muted-foreground text-sm mt-0.5">作成した記録</p>
        </div>
        <div className="flex items-center gap-2">
          <ShareCodeInput />
          <MiniCardCreator userId={profile?.id} onCreated={() => window.location.reload()} />
          {canUseFolders && profile && (
            <CreateFolderButton
              userId={profile.id}
              onFolderCreated={() => {
                const loadFolders = async () => {
                  const supabase = createClient()
                  const { data } = await supabase
                    .from('report_folders')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('sort_order', { ascending: true })
                  setFolders(data || [])
                }
                loadFolders()
              }}
            />
          )}
          <Link href="/reports/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新規記録
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats — inline condensed row (glass chip style) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm font-medium">
          <span className="text-foreground">{stats.totalSessions}</span>
          <span className="text-muted-foreground text-xs">セッション</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm">
          <span className="text-muted-foreground text-xs">KP</span><span className="font-medium">{stats.asKP}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm">
          <span className="text-muted-foreground text-xs">PL</span><span className="font-medium">{stats.asPL}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm">
          <span className="font-medium">{stats.uniqueScenarios}</span><span className="text-muted-foreground text-xs">シナリオ</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm">
          <span className="font-medium">{stats.totalHours.toFixed(0)}</span><span className="text-muted-foreground text-xs">h</span>
        </span>
        {stats.survivalRate > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 text-sm">
            <span className="text-muted-foreground text-xs">生還率</span><span className="font-medium">{stats.survivalRate}%</span>
          </span>
        )}
      </div>

      {/* Timeline view */}
      {viewMode === 'timeline' && <WalletTimeline />}

      {/* Filters (hidden in timeline mode) */}
      {viewMode !== 'timeline' && <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="シナリオ名・作者で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全期間</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}年</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterResult} onValueChange={(v: FilterResult) => setFilterResult(v)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="結果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="failure">失敗</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">新しい順</SelectItem>
            <SelectItem value="date_asc">古い順</SelectItem>
            <SelectItem value="name_asc">名前順 A-Z</SelectItem>
            <SelectItem value="name_desc">名前順 Z-A</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="rounded-none"
            title="グリッド"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="rounded-none"
            title="リスト"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('timeline')}
            className="rounded-none"
            title="タイムライン"
          >
            <Rss className="w-4 h-4" />
          </Button>
        </div>
      </div>}

      {/* Folder View Header (when inside a folder) */}
      {viewMode !== 'timeline' && openFolder && (
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenFolder(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{openFolder.name}</h2>
            <span className="text-sm text-muted-foreground">
              ({('reports' in openFolder ? openFolder.reports.length : 0)}件)
            </span>
          </div>
          {/* Delete button — only for real (DB-backed) folders, not virtual */}
          {isReportFolder(openFolder) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">フォルダを削除</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>フォルダを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{openFolder.name}」フォルダを削除します。フォルダ内の記録は削除されず、ウォレットに残ります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteFolder(openFolder.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Content Area */}
      {viewMode !== 'timeline' && (openFolder ? (
        // Inside folder — show reports only
        filteredReports.length > 0 ? (
          viewMode === 'grid' ? (
            <SessionCardGrid columns={4}>
              {filteredReports.map(report => (
                <SessionCard
                  key={report.id}
                  report={report}
                  showEdit
                />
              ))}
            </SessionCardGrid>
          ) : (
            <div className="space-y-3">
              {filteredReports.map(report => (
                <SessionCard
                  key={report.id}
                  report={report}
                  compact
                  showEdit
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState hasFilters={!!searchQuery || filterYear !== 'all' || filterResult !== 'all'} />
        )
      ) : (
        // Main view — folders and reports mixed naturally in same grid
        filteredGroupedItems.length > 0 ? (
          viewMode === 'grid' ? (
            <SessionCardGrid columns={4}>
              {filteredGroupedItems.map((item, index) => {
                if (isVirtualFolder(item)) {
                  return (
                    <FolderCard
                      key={`vf-${item.name}-${index}`}
                      folder={{
                        id: `virtual-${item.name}`,
                        user_id: '',
                        name: item.name,
                        description: null,
                        cover_report_id: null,
                        sort_order: 0,
                        created_at: '',
                        updated_at: '',
                        reports: item.reports,
                        ...calculateFolderStats(item.reports),
                      }}
                      onClick={() => setOpenFolder(item)}
                    />
                  )
                } else if (isPlayReport(item)) {
                  return (
                    <SessionCard
                      key={item.id}
                      report={item}
                      showEdit
                    />
                  )
                } else {
                  // Real folder (ReportFolder)
                  const folder = item as ReportFolder
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setOpenFolder(folder)}
                    />
                  )
                }
              })}
            </SessionCardGrid>
          ) : (
            <div className="space-y-3">
              {filteredGroupedItems.map((item, index) => {
                if (isVirtualFolder(item)) {
                  return (
                    <FolderCard
                      key={`vf-${item.name}-${index}`}
                      folder={{
                        id: `virtual-${item.name}`,
                        user_id: '',
                        name: item.name,
                        description: null,
                        cover_report_id: null,
                        sort_order: 0,
                        created_at: '',
                        updated_at: '',
                        reports: item.reports,
                        ...calculateFolderStats(item.reports),
                      }}
                      onClick={() => setOpenFolder(item)}
                    />
                  )
                } else if (isPlayReport(item)) {
                  return (
                    <SessionCard
                      key={item.id}
                      report={item}
                      compact
                      showEdit
                    />
                  )
                } else {
                  const folder = item as ReportFolder
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setOpenFolder(folder)}
                    />
                  )
                }
              })}
            </div>
          )
        ) : (
          <EmptyState hasFilters={!!searchQuery || filterYear !== 'all' || filterResult !== 'all'} />
        )
      ))}
    </div>
  )
}

function ShareCodeInput() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCode('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSearch() {
    const trimmed = code.trim()
    if (!trimmed) return

    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('play_reports')
        .select('id')
        .eq('share_code', trimmed.toUpperCase())
        .single()

      if (error || !data) {
        toast.error('共有コードが見つかりませんでした')
        return
      }

      router.push(`/reports/${data.id}`)
      setOpen(false)
      setCode('')
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setSearching(false)
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="w-4 h-4" />
        <span className="hidden sm:inline">コードを入力</span>
      </Button>
    )
  }

  return (
    <div ref={containerRef} className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="relative">
        <Input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
            if (e.key === 'Escape') { setOpen(false); setCode('') }
          }}
          placeholder="共有コード"
          maxLength={10}
          disabled={searching}
          className="w-[130px] sm:w-[160px] h-9 uppercase text-sm pr-8"
        />
        {searching ? (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        ) : code ? (
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => { setOpen(false); setCode('') }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

function MiniCardCreator({ userId, onCreated }: { userId?: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleCreate() {
    if (!userId || !text.trim()) return

    const lines = text
      .split('\n')
      .map(l => l
        .replace(/^[\s\t]*/, '')                                    // leading whitespace/tabs
        .replace(/^[\d０-９]+[.)）．]\s*/, '')                       // numbered lists: 1. 1) １）etc
        .replace(/^[-\-ー‐—―─*＊・·•◦◆◇●○□■▪▸▹▻►>＞]\s*/, '')  // bullet chars (half & full-width)
        .trim()
      )
      .filter(l => l.length > 0)

    if (lines.length === 0) {
      toast.error('シナリオ名を入力してください')
      return
    }

    setCreating(true)
    try {
      const supabase = createClient()

      // Check for existing scenario names in the user's wallet
      const { data: existingReports } = await supabase
        .from('play_reports')
        .select('scenario_name')
        .eq('user_id', userId)

      const existingNames = new Set(
        (existingReports || []).map(r => r.scenario_name.toLowerCase().trim())
      )

      const newLines = lines.filter(name => !existingNames.has(name.toLowerCase().trim()))
      const skippedCount = lines.length - newLines.length

      if (newLines.length === 0) {
        toast.error('すべてのシナリオがすでにウォレットに存在しています')
        return
      }

      // Find or create the "ミニカード" folder
      let folderId: string | null = null
      const { data: existingFolder } = await supabase
        .from('report_folders')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'ミニカード')
        .maybeSingle()

      if (existingFolder) {
        folderId = existingFolder.id
      } else {
        const { data: newFolder, error: folderError } = await supabase
          .from('report_folders')
          .insert({
            user_id: userId,
            name: 'ミニカード',
            sort_order: 999,
          })
          .select('id')
          .single()

        if (folderError) {
          // Unique constraint violation (23505) — folder was created by a concurrent request
          if (folderError.code === '23505') {
            const { data: retryFolder } = await supabase
              .from('report_folders')
              .select('id')
              .eq('user_id', userId)
              .eq('name', 'ミニカード')
              .maybeSingle()
            if (retryFolder) {
              folderId = retryFolder.id
            } else {
              console.error('Folder creation failed:', folderError)
              toast.error('フォルダの作成に失敗しました')
              return
            }
          } else {
            console.error('Folder creation failed:', folderError)
            toast.error('フォルダの作成に失敗しました')
            return
          }
        } else {
          folderId = newFolder.id
        }
      }

      // Bulk insert mini-cards (only new ones)
      const now = new Date().toISOString()
      const { error: insertError } = await supabase
        .from('play_reports')
        .insert(
          newLines.map((name) => ({
            user_id: userId,
            scenario_name: name,
            is_mini: true,
            play_date_start: now,
            privacy_setting: 'public',
            folder_id: folderId,
          }))
        )

      if (insertError) {
        console.error('Mini-card creation failed:', insertError)
        toast.error('ミニカードの作成に失敗しました')
        return
      }

      if (skippedCount > 0) {
        toast.success(`${newLines.length}件のミニカードを作成しました（${skippedCount}件は既に存在するためスキップ）`)
      } else {
        toast.success(`${newLines.length}件のミニカードを作成しました`)
      }
      setOpen(false)
      setText('')
      onCreated()
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const lineCount = text.split('\n').filter(l => l.trim().length > 0).length

  if (!open) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 rounded-full glass border-border/40 hover:border-primary/30 hover:bg-background/60"
            onClick={() => setOpen(true)}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">ミニカード</span>
            <HelpCircle className="w-3 h-3 text-muted-foreground hidden sm:inline" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px] text-left leading-relaxed">
          ミニカードとは、箇条書きになっている通過済みシナリオをコピペして仮置きできる機能です。編集することで、カードにして詳細の編集ができます。
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Loading overlay */}
      {creating && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="w-full max-w-xs mx-4 rounded-3xl glass-strong glass-sheen shadow-depth-3 border border-border/40 p-6 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="font-semibold text-sm">ミニカードを作成中...</p>
              <p className="text-xs text-muted-foreground">
                {lineCount}件のシナリオを処理しています。
              </p>
              <p className="text-xs text-muted-foreground">
                しばらくお待ちください
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full max-w-lg mx-4 rounded-3xl glass-strong glass-sheen shadow-depth-3 border border-border/40 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl glass border border-border/40 shadow-depth-1 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground leading-tight">ミニカード一括作成</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                通過済みシナリオを1行ずつ入力（50件以上もOK）
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setOpen(false)} disabled={creating}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`毒入りスープ\n狂気山脈\n水底よりの使者\n深きものの結婚式\nペルソナ\n毒蛇の園\n…`}
          rows={15}
          disabled={creating}
          className="font-mono text-sm min-h-[200px] max-h-[50vh] resize-y rounded-2xl bg-background/40 backdrop-blur-sm border-border/40 focus-visible:ring-2 focus-visible:ring-primary/30"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {lineCount > 0 ? `${lineCount}件のシナリオ` : 'シナリオ名を改行区切りで入力'}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)} disabled={creating}>
              キャンセル
            </Button>
            <Button className="rounded-full" onClick={handleCreate} disabled={creating || lineCount === 0}>
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />作成中...</>
              ) : (
                `${lineCount}件を作成`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="glass glass-sheen shadow-depth-1 border-border/30 rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-xl font-semibold tracking-tight text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">条件に一致する記録がありません</p>
          <p className="text-sm text-muted-foreground mt-1">
            フィルターを変更してください
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">まだセッション記録がありません</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          最初のセッションを記録してみましょう
        </p>
        <Link href="/reports/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新規記録を作成
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
