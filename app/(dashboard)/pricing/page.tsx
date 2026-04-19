'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Crown, Check, Sparkles, Loader2, BadgeCheck,
  Image as ImageIcon, Link2, FileText, Tag, FolderOpen, Download,
} from 'lucide-react'
import { SubscriptionCheckout } from '@/components/subscription-checkout'
import type { Profile } from '@/lib/types'

const WALLET_FEATURES = [
  { icon: ImageIcon, text: '画像アップロード無制限（高解像度 2400px）' },
  { icon: Link2,     text: '関連リンク無制限' },
  { icon: FileText,  text: '感想メモ無制限・Markdown対応' },
  { icon: FileText,  text: 'プライベートノート（非公開メモ）' },
  { icon: Tag,       text: 'カスタムタグ（最大5個/レポート）' },
  { icon: FolderOpen,text: 'フォルダでシナリオを整理' },
  { icon: Download,  text: 'データエクスポート' },
  { icon: BadgeCheck,text: 'ウォレットバッジ表示' },
]

const FREE_FEATURES = [
  'セッション記録（無制限）',
  '画像アップロード（5枚/1200px）',
  '関連リンク（5個）',
  '感想メモ（500文字）',
  'フォロー・フレンド機能',
]

// Stripe product ID for the wallet one-time purchase
const WALLET_PRODUCT_ID = 'pro-monthly'

export default function PricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const hasWallet = profile?.tier === 'pro' || profile?.tier === 'streamer'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">R&apos;lyeh Wallet</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          TRPGセッションをもっと深く、もっと自由に記録するための<br />
          すべての機能を一度に手に入れる
        </p>
      </div>

      {/* Already purchased state */}
      {hasWallet ? (
        <div className="rounded-3xl glass-strong glass-sheen shadow-depth-2 border border-primary/30 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl glass border border-amber-400/30 shadow-depth-2 flex items-center justify-center mx-auto">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-lg tracking-tight">ウォレット購入済み</p>
            <p className="text-sm text-muted-foreground mt-1">すべての機能をご利用いただけます</p>
          </div>
          <div className="rounded-2xl bg-background/40 border border-border/30 px-5 py-4 text-left">
            <ul className="space-y-2.5">
              {WALLET_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Purchase card */
        <div className="rounded-3xl glass-strong glass-sheen shadow-depth-3 border border-border/40 overflow-hidden">
          {/* Hero section */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/30">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold glass border border-amber-400/30 text-amber-500 shadow-depth-1">
                <Sparkles className="w-3 h-3" />
                ローンチ割引中
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl glass border border-amber-400/30 shadow-depth-2 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">ウォレットを手に入れる</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              記録の自由度を最大限に高める、すべての機能をまとめて
            </p>
          </div>

          {/* Price */}
          <div className="px-8 py-6 border-b border-border/30">
            <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/30 py-5 text-center">
              <div className="flex items-end justify-center gap-2">
                <span className="text-5xl font-semibold tracking-tight text-foreground">¥980</span>
                <div className="mb-2 text-left">
                  <p className="text-xs text-muted-foreground line-through">¥1,480</p>
                  <p className="text-[11px] text-emerald-500 font-medium">買い切り</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">一度購入するとずっと使えます。月額費用はかかりません。</p>
            </div>
          </div>

          {/* Features */}
          <div className="px-8 py-6 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">含まれる機能</p>
            <ul className="space-y-3">
              {WALLET_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Free tier reminder */}
          <div className="px-8 py-5 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">無料でも使える機能</p>
            <ul className="space-y-2">
              {FREE_FEATURES.map((text) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-background/60 border border-border/40 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-8 py-6">
            <SubscriptionCheckout
              productId={WALLET_PRODUCT_ID}
              billingPeriod="monthly"
              trigger={
                <Button className="w-full rounded-full h-12 text-sm font-semibold gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  今すぐ購入する（¥980）
                </Button>
              }
            />
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              安全な決済はStripeが提供します • 税込表示
            </p>
          </div>
        </div>
      )}

      {/* FAQ / notes */}
      <div className="rounded-2xl glass border border-border/40 shadow-depth-1 px-6 py-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">よくある質問</p>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground/90">本当に月額なしで使えますか？</p>
            <p className="text-muted-foreground text-xs mt-0.5">はい。一度購入するとアカウントが有効な限り継続して利用できます。</p>
          </div>
          <div>
            <p className="font-medium text-foreground/90">購入しなくても使えますか？</p>
            <p className="text-muted-foreground text-xs mt-0.5">無料でもセッション記録の基本機能は利用できます。購入で機能が大幅に拡張されます。</p>
          </div>
          <div>
            <p className="font-medium text-foreground/90">ローンチ割引はいつまでですか？</p>
            <p className="text-muted-foreground text-xs mt-0.5">期間限定のため、終了時期は未定です。お早めにどうぞ。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
