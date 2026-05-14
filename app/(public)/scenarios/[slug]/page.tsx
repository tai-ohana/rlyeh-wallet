import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScenarioDetailClient } from './scenario-detail-client'
import type { ScenarioStats, ScenarioKpStat, PlayReport } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const scenarioName = decodeURIComponent(slug)

  return {
    title: `${scenarioName} | シナリオDB | R'lyeh Wallet`,
    description: `「${scenarioName}」の通過記録・生還率・KP一覧など、プレイヤーが積み上げたシナリオデータ。`,
    openGraph: {
      title: `${scenarioName} | シナリオDB`,
      description: `「${scenarioName}」のプレイデータ。通過記録・生還率・KP情報が確認できます。`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${scenarioName} | シナリオDB`,
      description: `「${scenarioName}」のプレイデータ。通過記録・生還率・KP情報。`,
    },
  }
}

export const revalidate = 3600

export default async function ScenarioDetailPage({ params }: Props) {
  const { slug } = await params
  const scenarioName = decodeURIComponent(slug)
  const supabase = await createClient()

  // シナリオ集計データ
  const { data: stats } = await supabase
    .from('scenario_stats')
    .select('*')
    .eq('scenario_name', scenarioName)
    .single()

  if (!stats) notFound()

  // KP一覧
  const { data: kpStats } = await supabase
    .from('scenario_kp_stats')
    .select('*')
    .eq('scenario_name', scenarioName)
    .order('run_count', { ascending: false })
    .limit(12)

  // 最近の公開レポート
  const { data: recentReports } = await supabase
    .from('play_reports')
    .select(`
      id, scenario_name, play_date_start, cover_image_url, impression, result,
      profile:profiles(username, display_name, avatar_url)
    `)
    .eq('scenario_name', scenarioName)
    .eq('privacy_setting', 'public')
    .order('play_date_start', { ascending: false })
    .limit(20)

  return (
    <ScenarioDetailClient
      stats={stats as ScenarioStats}
      kpStats={(kpStats ?? []) as ScenarioKpStat[]}
      recentReports={(recentReports ?? []) as unknown as PlayReport[]}
    />
  )
}
