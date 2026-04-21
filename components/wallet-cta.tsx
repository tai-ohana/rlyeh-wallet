'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crown, Sparkles, Check, ArrowRight } from 'lucide-react'
import { SubscriptionCheckout } from '@/components/subscription-checkout'
import { Button } from '@/components/ui/button'

const WALLET_PRODUCT_ID = 'pro-monthly'

const TEASER_FEATURES = [
  '画像・リンク無制限',
  'Markdown詳細メモ',
  'プライベートノート',
  'データエクスポート',
]

// ─────────────────────────────────────────
// WalletPurchaseCTA — shown in sidebar for free users
// ─────────────────────────────────────────
export function WalletPurchaseCTA() {
  const [purchased, setPurchased] = useState(false)

  // Optimistically switch to owner badge immediately after purchase
  if (purchased) {
    return <WalletOwnerBadge tier="pro" />
  }

  return (
    <div className="relative rounded-2xl glass glass-sheen shadow-depth-1 border border-amber-400/20 p-4 mb-4 overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl glass border border-amber-400/30 shadow-depth-1 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">ウォレット未所有</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">買い切りで全機能解放</p>
          </div>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold glass border border-amber-400/30 text-amber-500 shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
            SALE
          </span>
        </div>

        {/* Feature teaser */}
        <ul className="space-y-1 mb-3">
          {TEASER_FEATURES.map((text) => (
            <li key={text} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Check className="w-1.5 h-1.5 text-emerald-500" strokeWidth={3} />
              </div>
              <span className="text-[11px] text-foreground/70">{text}</span>
            </li>
          ))}
        </ul>

        {/* Price & CTA */}
        <div className="rounded-xl bg-background/40 backdrop-blur-sm border border-border/30 px-3 py-2 mb-2 flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight">¥980</span>
          <span className="text-[10px] text-muted-foreground line-through">¥1,480</span>
          <span className="text-[10px] text-emerald-500 font-medium ml-auto">買い切り</span>
        </div>

        <SubscriptionCheckout
          productId={WALLET_PRODUCT_ID}
          billingPeriod="monthly"
          onSuccess={() => setPurchased(true)}
          trigger={
            <Button
              size="sm"
              className="w-full rounded-full h-8 text-xs font-semibold gap-1.5"
            >
              ウォレットを購入
              <ArrowRight className="w-3 h-3" />
            </Button>
          }
        />

        <Link
          href="/pricing"
          className="block text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1.5"
        >
          詳細を見る
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// WalletOwnerBadge — shown in sidebar for pro/streamer users
// ─────────────────────────────────────────
export function WalletOwnerBadge({ tier }: { tier: 'pro' | 'streamer' }) {
  return (
    <div className="relative rounded-2xl glass glass-sheen shadow-depth-1 border border-amber-400/30 p-3 mb-4 overflow-hidden">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl glass-strong border border-amber-400/40 shadow-depth-1 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold leading-tight">ウォレット所有者</p>
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400/40 shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {tier === 'streamer' ? '配信者モード有効' : 'すべての機能が解放中'}
          </p>
        </div>
      </div>
    </div>
  )
}
