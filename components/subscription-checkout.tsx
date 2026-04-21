'use client'

import React from "react"

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession } from '@/app/actions/stripe'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Crown, Check, Sparkles, Wallet, FileText } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface SubscriptionCheckoutProps {
  productId: string
  billingPeriod?: 'monthly' | 'yearly'
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function SubscriptionCheckout({
  productId,
  billingPeriod = 'monthly',
  trigger,
  onSuccess
}: SubscriptionCheckoutProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<'checkout' | 'success'>('checkout')

  const fetchClientSecret = useCallback(async () => {
    setIsLoading(true)
    try {
      const clientSecret = await createCheckoutSession(productId, billingPeriod)
      return clientSecret
    } finally {
      setIsLoading(false)
    }
  }, [productId, billingPeriod])

  const handleComplete = useCallback(() => {
    setPhase('success')
    // onSuccess is called when user clicks a button in SuccessScreen, not here
    // This prevents the parent from unmounting this component before the screen shows
  }, [])

  const handleClose = useCallback((nextPath?: string) => {
    setIsOpen(false)
    onSuccess?.() // notify parent now — dialog is closing, safe to unmount
    setTimeout(() => {
      router.refresh()
      if (nextPath) router.push(nextPath)
    }, 200)
  }, [router, onSuccess])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open && phase === 'success') {
      // If closing after success, refresh to update UI
      setTimeout(() => {
        router.refresh()
        setPhase('checkout')
      }, 200)
    }
  }, [phase, router])

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              読み込み中...
            </>
          ) : (
            'ウォレットを購入する'
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={
            phase === 'success'
              ? 'max-w-md !p-0 overflow-hidden rounded-3xl border-border/40'
              : 'max-w-lg max-h-[90vh] overflow-y-auto'
          }
        >
          {phase === 'checkout' ? (
            <>
              <DialogHeader>
                <DialogTitle>ウォレットを購入</DialogTitle>
              </DialogHeader>

              {isOpen && (
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{
                    fetchClientSecret,
                    onComplete: handleComplete,
                  }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </>
          ) : (
            <SuccessScreen onClose={handleClose} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─────────────────────────────────────────
// SuccessScreen
// ─────────────────────────────────────────
function SuccessScreen({ onClose }: { onClose: (nextPath?: string) => void }) {
  return (
    <div className="relative">
      {/* Ambient celebration glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-violet-500/15 blur-2xl" />
      </div>

      {/* Hero */}
      <div className="relative px-8 pt-10 pb-6 text-center">
        {/* Crown with check badge */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-3xl glass-strong border border-amber-400/40 shadow-depth-3 flex items-center justify-center">
            <Crown className="w-9 h-9 text-amber-400 fill-amber-400/30" />
          </div>
          {/* Check badge bottom-right */}
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-emerald-500 border-2 border-background shadow-depth-2 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          {/* Sparkles */}
          <Sparkles className="absolute -top-2 -left-3 w-4 h-4 text-amber-400 fill-amber-400/40" />
          <Sparkles className="absolute top-2 -right-4 w-3 h-3 text-primary fill-primary/30" />
        </div>

        <p className="text-xs font-semibold text-amber-500 uppercase tracking-[0.2em] mb-2">
          Purchase Complete
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          ウォレットを手に入れました
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          すべての機能が解放されました。<br />
          さあ、最初のカードを作りましょう。
        </p>
      </div>

      {/* Unlocked features - compact */}
      <div className="relative px-8 pb-4">
        <div className="rounded-2xl bg-background/40 backdrop-blur-sm border border-border/30 px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            解放された機能
          </p>
          <ul className="space-y-1.5">
            {[
              '画像・リンク無制限',
              'Markdown対応の詳細メモ',
              'プライベートノート',
              'フォルダで整理・データエクスポート',
            ].map((text) => (
              <li key={text} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-emerald-500" strokeWidth={3} />
                </div>
                <span className="text-xs text-foreground/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTAs */}
      <div className="relative px-8 pb-7 pt-3 space-y-2.5">
        <Button
          className="w-full rounded-full h-11 text-sm font-semibold gap-2"
          onClick={() => onClose('/reports/new')}
        >
          <FileText className="w-4 h-4" />
          最初のセッションを記録する
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-full h-11 text-sm font-medium gap-2 glass border-border/40 hover:border-primary/30"
          onClick={() => onClose('/wallet')}
        >
          <Wallet className="w-4 h-4" />
          ウォレットを見る
        </Button>
        <button
          onClick={() => onClose()}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          あとで
        </button>
      </div>
    </div>
  )
}
