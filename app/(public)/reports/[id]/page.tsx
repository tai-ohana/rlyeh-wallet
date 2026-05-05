import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarDays, Clock, Users, Share2, Edit, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ShareCodeButton } from '@/components/share-code-button'
import { ImageCarousel } from '@/components/image-carousel'
import { YouTubeEmbed } from '@/components/youtube-embed'
import { SmartContentRenderer } from '@/components/markdown-renderer'
import { ReportShareButtons } from '@/components/report-share-buttons'
import { canUseFeature, getProfileLimits } from '@/lib/tier-limits'
import type { Metadata } from 'next'
import type { YouTubeLink, Profile as ProfileType } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!uuidRegex.test(id)) return {}

  const supabase = await createClient()
  const { data: report } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author, impression, cover_image_url, profile:profiles(display_name, username)')
    .eq('id', id)
    .single()

  if (!report) return {}

  const profile = report.profile as { display_name: string | null; username: string } | null
  const title = `${report.scenario_name} — ${profile?.display_name || profile?.username || 'プレイヤー'}の通過記録`
  const description = report.impression
    ? report.impression.slice(0, 120) + (report.impression.length > 120 ? '…' : '')
    : report.scenario_author
    ? `作者: ${report.scenario_author} のシナリオ通過記録`
    : 'TRPGセッション通過記録'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: report.cover_image_url
        ? [{ url: report.cover_image_url, width: 1200, height: 630, alt: report.scenario_name }]
        : [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: report.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      images: report.cover_image_url ? [report.cover_image_url] : ['/og-image.png'],
    },
  }
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params

  if (!uuidRegex.test(id)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: report } = await supabase
    .from('play_reports')
    .select(`
      *,
      profile:profiles(id, username, display_name, avatar_url),
      participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
      images:play_report_images(*),
      tags:report_tags(*)
    `)
    .eq('id', id)
    .single()

  if (!report) notFound()

  // Privacy check: private reports only visible to owner
  if (report.privacy_setting === 'private' && user?.id !== report.user_id) {
    notFound()
  }

  const { data: youtubeLinks } = await supabase
    .from('youtube_links')
    .select('*')
    .eq('play_report_id', id)
    .order('sort_order', { ascending: true })

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', report.user_id)
    .single()

  const isOwner = user?.id === report.user_id
  const kpParticipants = report.participants?.filter((p: { role: string }) => p.role === 'KP') || []
  const plParticipants = report.participants?.filter((p: { role: string }) => p.role === 'PL') || []
  const isMarkdownEnabled = canUseFeature(ownerProfile as ProfileType | null, 'canUseMarkdownMemo')

  const resultLabels: Record<string, string> = { success: '成功', failure: '失敗', other: 'その他' }
  const endTypeLabels: Record<string, string> = { clear: 'クリア', bad_end: 'バッドエンド', dead: '全滅', ongoing: '継続中' }
  const participantResultLabels: Record<string, string> = { survive: '生還', lost: 'ロスト', dead: 'ロスト', insane: 'ロスト', other: 'その他' }
  const editionLabels: Record<string, string> = { 'coc6': 'CoC 6版', 'coc7': 'CoC 7版', 'new-cthulhu': '新クトゥルフ神話TRPG', 'delta-green': 'Delta Green', 'other': 'その他' }

  const allImages: string[] = []
  if (report.cover_image_url) allImages.push(report.cover_image_url)
  if (report.images?.length > 0) {
    const sorted = [...report.images].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    for (const img of sorted) { if (img.image_url) allImages.push(img.image_url) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{report.scenario_name}</h1>
          {report.scenario_author && (
            <p className="text-muted-foreground">作者: {report.scenario_author}</p>
          )}
          {report.tags && report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {report.tags.map((tag: { id: string; tag_name: string }) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.tag_name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && report.share_code && <ShareCodeButton code={report.share_code} />}
          {isOwner && (
            <Link href={`/reports/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Edit className="w-4 h-4" />
                編集
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Image Carousel */}
      {allImages.length > 0 && <ImageCarousel images={allImages} />}

      {/* Author Card */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link href={`/user/${report.profile?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="w-12 h-12 rounded-xl">
                <AvatarImage src={report.profile?.avatar_url || undefined} className="rounded-xl" />
                <AvatarFallback className="bg-primary/20 text-primary rounded-xl">
                  {(report.profile?.display_name || report.profile?.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{report.profile?.display_name || report.profile?.username}</p>
                <p className="text-sm text-muted-foreground">@{report.profile?.username}</p>
              </div>
            </Link>
            {/* Share buttons */}
            <ReportShareButtons
              reportId={id}
              scenarioName={report.scenario_name}
              impression={report.impression}
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            セッション情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">プレイ日</p>
              <div className="flex items-center gap-2 mt-1">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(report.play_date_start)}</span>
                {report.play_date_end && report.play_date_end !== report.play_date_start && (
                  <span>〜 {formatDate(report.play_date_end)}</span>
                )}
              </div>
            </div>
            {report.play_duration && (
              <div>
                <p className="text-sm text-muted-foreground">プレイ時間</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{report.play_duration}時間</span>
                </div>
              </div>
            )}
          </div>

          {report.edition && (
            <div>
              <p className="text-sm text-muted-foreground">版・システム</p>
              <p className="mt-1">{editionLabels[report.edition] || report.edition}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {report.result && (
              <Badge variant="outline" className={
                report.result === 'success' ? 'bg-primary/20 text-primary border-primary/30'
                : report.result === 'failure' ? 'bg-destructive/20 text-destructive border-destructive/30'
                : 'bg-muted text-muted-foreground'
              }>
                {resultLabels[report.result]}
              </Badge>
            )}
            {report.end_type && (
              <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30">
                {endTypeLabels[report.end_type]}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      {(kpParticipants.length > 0 || plParticipants.length > 0) && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              参加者
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpParticipants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">KP（キーパー）</p>
                <div className="space-y-2">
                  {kpParticipants.map((p: { id: string; username: string; user_id?: string | null; profile?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null }) => {
                    const linkedUsername = p.user_id && p.username.startsWith('@') ? p.username.slice(1) : null
                    const displayName = linkedUsername && p.profile ? (p.profile.display_name || p.profile.username) : p.username
                    const inner = (
                      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-background/50', linkedUsername && 'hover:bg-background/80 transition-colors')}>
                        <Avatar className="w-8 h-8 rounded-lg">
                          {linkedUsername && p.profile?.avatar_url && <AvatarImage src={p.profile.avatar_url} className="rounded-lg" />}
                          <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">{displayName.replace('@', '').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className={linkedUsername ? 'text-primary hover:underline' : ''}>{displayName}</span>
                      </div>
                    )
                    return linkedUsername
                      ? <Link key={p.id} href={`/user/${linkedUsername}`}>{inner}</Link>
                      : <div key={p.id}>{inner}</div>
                  })}
                </div>
              </div>
            )}

            {plParticipants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">PL（プレイヤー）</p>
                <div className="space-y-2">
                  {plParticipants.map((p: { id: string; username: string; user_id?: string | null; character_name?: string; result?: string; profile?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null }) => {
                    const linkedUsername = p.user_id && p.username.startsWith('@') ? p.username.slice(1) : null
                    const displayName = linkedUsername && p.profile ? (p.profile.display_name || p.profile.username) : p.username
                    const inner = (
                      <div className={cn('flex items-center justify-between p-2 rounded-lg bg-background/50', linkedUsername && 'hover:bg-background/80 transition-colors')}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 rounded-lg">
                            {linkedUsername && p.profile?.avatar_url && <AvatarImage src={p.profile.avatar_url} className="rounded-lg" />}
                            <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-lg">{displayName.replace('@', '').slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className={linkedUsername ? 'text-primary hover:underline' : ''}>{displayName}</span>
                            {p.character_name && <span className="text-sm text-muted-foreground ml-2">/ {p.character_name}</span>}
                          </div>
                        </div>
                        {p.result && (
                          <Badge variant="outline" className={
                            p.result === 'survive' ? 'bg-primary/20 text-primary border-primary/30'
                            : (p.result === 'lost' || p.result === 'dead' || p.result === 'insane') ? 'bg-destructive/20 text-destructive border-destructive/30'
                            : 'bg-muted text-muted-foreground'
                          }>
                            {participantResultLabels[p.result]}
                          </Badge>
                        )}
                      </div>
                    )
                    return linkedUsername
                      ? <Link key={p.id} href={`/user/${linkedUsername}`}>{inner}</Link>
                      : <div key={p.id}>{inner}</div>
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* YouTube Embed */}
      {youtubeLinks && youtubeLinks.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <YouTubeEmbed youtubeLinks={youtubeLinks as YouTubeLink[]} />
          </CardContent>
        </Card>
      )}

      {/* Impression */}
      {report.impression && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>感想・メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <SmartContentRenderer content={report.impression} isMarkdownEnabled={isMarkdownEnabled} />
          </CardContent>
        </Card>
      )}

      {/* Private Notes - owner only */}
      {isOwner && report.private_notes && (
        <Card className="bg-card/50 border-dashed border-border/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              🔒 プライベートノート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SmartContentRenderer content={report.private_notes} isMarkdownEnabled={isMarkdownEnabled} />
          </CardContent>
        </Card>
      )}

      {/* Share Code - owner only */}
      {isOwner && report.share_code && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              共有コード
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
              <code className="text-lg font-mono tracking-widest flex-1">{report.share_code}</code>
              <ShareCodeButton code={report.share_code} variant="icon" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              このコードを共有すると、参加者が自分のウォレットに追加できます
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTA for non-logged-in users */}
      {!user && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">あなたのTRPG通過記録を残しませんか？</p>
            <p className="text-sm text-muted-foreground">
              R&apos;lyeh Wallet では、セッション記録・統計・プロフィールを無料で管理できます
            </p>
            <Link href="/auth/sign-up">
              <Button className="mt-2">無料で始める</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
