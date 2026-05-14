import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ScenarioListClient } from './scenario-list-client'

export const metadata: Metadata = {
  title: 'シナリオDB | R\'lyeh Wallet',
  description: 'TRPGプレイヤーの記録から生まれたシナリオデータベース。通過人数・生還率・プレイ時間などの統計が確認できます。',
  openGraph: {
    title: 'シナリオDB | R\'lyeh Wallet',
    description: 'TRPGコミュニティが積み上げた、シナリオの通過データ一覧。',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'シナリオDB | R\'lyeh Wallet',
    description: 'TRPGコミュニティが積み上げた、シナリオの通過データ一覧。',
  },
}

export const revalidate = 3600 // 1時間キャッシュ

export default async function ScenariosPage() {
  const supabase = await createClient()

  const { data: scenarios } = await supabase
    .from('scenario_stats')
    .select('*')
    .order('total_sessions', { ascending: false })
    .limit(200)

  return <ScenarioListClient scenarios={scenarios ?? []} />
}
