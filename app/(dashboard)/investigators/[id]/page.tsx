'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { ArrowLeft, Edit2, Trash2, BookOpen, CalendarDays, Plus } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Investigator, InvestigatorSession, InvestigatorStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<InvestigatorStatus, { label: string; pill: string }> = {
  active:  { label: '生存中',  pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lost:    { label: 'ロスト',  pill: 'bg-red-500/20 text-red-300 border-red-500/30' },
  retired: { label: '引退',   pill: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

const RESULT_LABELS: Record<string, { label: string; style: string }> = {
  survive: { label: '生還', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lost:    { label: 'ロスト', style: 'bg-red-500/20 text-red-300 border-red-500/30' },
  other:   { label: 'その他', style: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

export default function InvestigatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [investigator, setInvestigator] = useState<Investigator | null>(null)
  const [sessions, setSessions] = useState<InvestigatorSession[]>([])
  const [isOwn, setIsOwn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: inv } = await supabase
        .from('investigators')
        .select('*')
        .eq('id', id)
        .single()

      if (!inv) { router.replace('/investigators'); return }
      setInvestigator(inv)
      setIsOwn(user?.id === inv.user_id)

      const { data: sessData } = await supabase
        .from('investigator_sessions')
        .select(`
          *,
          play_report:play_reports(id, scenario_name, play_date_start, cover_image_url)
        `)
        .eq('investigator_id', id)
        .order('created_at', { ascending: false })

      setSessions(sessData ?? [])
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase.from('investigators').delete().eq('id', id)
    if (error) { toast.error('削除に失敗しました'); return }
    toast.success('探索者を削除しました')
    router.push('/investigators')
  }

  if (loading || !investigator) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted/30 rounded animate-pulse w-32" />
        <div className="aspect-[3/1] bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const status = STATUS_CONFIG[investigator.status]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/investigators">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        {isOwn && (
          <div className="flex gap-2">
            <Link href={`/investigators/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                <Edit2 className="w-3.5 h-3.5" />
                編集
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>探索者を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{investigator.name}」を削除します。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900">
        {/* Background image (blurred) */}
        {investigator.avatar_url && (
          <div className="absolute inset-0">
            <Image src={investigator.avatar_url} alt="" fill className="object-cover blur-2xl opacity-30 scale-110" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative flex items-end gap-5 p-6">
          {/* Portrait */}
          <div className="relative w-28 h-40 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/40">
            {investigator.avatar_url ? (
              <Image src={investigator.avatar_url} alt={investigator.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-zinc-800">
                <span className="text-3xl font-bold text-white/30">{investigator.name.slice(0, 1)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pb-1 space-y-2 min-w-0">
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.pill}`}>
              {status.label}
            </span>
            <h1 className="text-2xl font-bold text-white leading-tight">{investigator.name}</h1>
            <div className="flex items-center gap-3 text-sm text-white/60 flex-wrap">
              {investigator.occupation && <span>{investigator.occupation}</span>}
              {investigator.age && <span>{investigator.age}歳</span>}
              <span>{sessions.length}セッション</span>
            </div>
            {/* Stats */}
            {(investigator.hp_max || investigator.mp_max || investigator.san_max) && (
              <div className="flex gap-3 text-xs">
                {investigator.hp_max && (
                  <span className="text-white/50">HP <span className="text-white/80 font-semibold">{investigator.hp_max}</span></span>
                )}
                {investigator.mp_max && (
                  <span className="text-white/50">MP <span className="text-white/80 font-semibold">{investigator.mp_max}</span></span>
                )}
                {investigator.san_max && (
                  <span className="text-white/50">SAN <span className="text-white/80 font-semibold">{investigator.san_current ?? '?'}/{investigator.san_max}</span></span>
                )}
              </div>
            )}
            {/* Tags */}
            {investigator.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {investigator.tags.map(tag => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/60">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backstory */}
      {investigator.backstory && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground mb-2">バックストーリー</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{investigator.backstory}</p>
          </CardContent>
        </Card>
      )}

      {/* Session history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            セッション履歴
          </h2>
          {isOwn && (
            <Link href={`/investigators/${id}/link-session`}>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent text-xs">
                <Plus className="w-3.5 h-3.5" />
                セッションをリンク
              </Button>
            </Link>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            まだセッションが記録されていません
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => {
              const report = s.play_report
              const result = s.result ? RESULT_LABELS[s.result] : null
              return (
                <Link key={s.id} href={`/reports/${s.play_report_id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40 hover:border-border/70 transition-colors">
                    {/* Cover */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                      {report?.cover_image_url ? (
                        <Image src={report.cover_image_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{report?.scenario_name ?? '不明なシナリオ'}</p>
                      {report?.play_date_start && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(report.play_date_start)}
                        </p>
                      )}
                    </div>
                    {/* Result */}
                    {result && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${result.style}`}>
                        {result.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
