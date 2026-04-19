'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/image-upload'
import { SubscriptionCheckout } from '@/components/subscription-checkout'
import {
  Loader2, CheckCircle2, XCircle, AtSign,
  BookOpen, Users, Search, Star, Crown, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'profile' | 'welcome'

const FREE_HIGHLIGHTS = [
  { icon: BookOpen, text: 'セッションレポートを記録・管理' },
  { icon: Users,    text: 'フレンドとシナリオをシェア' },
  { icon: Search,   text: 'コミュニティのレポートを探索' },
  { icon: Star,     text: 'ウォレットでシナリオを整理' },
]

const PRO_PRODUCT_ID = 'pro-monthly'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bio, setBio] = useState('')

  // Validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && profile.username && !profile.username.startsWith('pending_')) {
        router.push('/dashboard')
        return
      }

      setUserId(user.id)

      const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setDisplayName(name)

      const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
      setAvatarUrl(avatar)

      setLoading(false)
    }

    checkUser()
  }, [router])

  // Username validation
  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle')
      setUsernameError(null)
      return
    }

    const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username)
    if (!isValidFormat) {
      setUsernameStatus('invalid')
      if (username.length < 3) {
        setUsernameError('3文字以上で入力してください')
      } else if (username.length > 20) {
        setUsernameError('20文字以下で入力してください')
      } else {
        setUsernameError('英数字とアンダースコア(_)のみ使用できます')
      }
      return
    }

    setUsernameStatus('checking')
    setUsernameError(null)

    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

      if (data) {
        setUsernameStatus('taken')
        setUsernameError('このIDは既に使用されています')
      } else {
        setUsernameStatus('available')
        setUsernameError(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!userId || usernameStatus !== 'available' || !displayName.trim()) {
      toast.error('入力内容を確認してください')
      return
    }

    setSaving(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: username.toLowerCase(),
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('このIDは既に使用されています')
        setUsernameStatus('taken')
      } else {
        toast.error('プロフィールの作成に失敗しました')
      }
      setSaving(false)
      return
    }

    // Proceed to welcome step instead of navigating away
    setSaving(false)
    setStep('welcome')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ambient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ambient flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-lg group-hover:bg-primary/30 transition-colors" />
              <Image
                src="/logo.png"
                alt="R'lyeh Wallet"
                width={48}
                height={48}
                className="relative rounded-2xl shadow-depth-1"
              />
            </div>
            <span className="font-semibold text-xl tracking-tight">{"R'lyeh Wallet"}</span>
          </Link>
        </div>

        {step === 'profile' ? (
          /* ── Step 1: Profile setup ── */
          <div className="rounded-3xl glass-strong glass-sheen shadow-depth-3 border border-border/40 overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-border/30">
              <h1 className="text-2xl font-semibold tracking-tight text-center">プロフィール設定</h1>
              <p className="text-sm text-muted-foreground text-center mt-1.5">
                あなたのアカウント情報を設定してください
              </p>
            </div>

            <div className="px-8 py-7">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">プロフィール画像</Label>
                  <div className="flex justify-center">
                    <ImageUpload
                      value={avatarUrl}
                      onChange={setAvatarUrl}
                      disabled={saving}
                      className="w-28 h-28 rounded-2xl"
                      aspectRatio="square"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    アカウントID <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="your_account_id"
                      className="pl-9 pr-10 rounded-xl bg-background/40 backdrop-blur-sm border-border/40 focus-visible:ring-2 focus-visible:ring-primary/30"
                      disabled={saving}
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {usernameStatus === 'available' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {usernameError ? (
                    <p className="text-xs text-rose-500">{usernameError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Twitter/X のIDと同じにすることを推奨します。英数字と_のみ、3〜20文字
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    表示名 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="表示名"
                    disabled={saving}
                    required
                    maxLength={50}
                    className="rounded-xl bg-background/40 backdrop-blur-sm border-border/40 focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">他のユーザーに表示される名前です</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    自己紹介
                    <span className="text-muted-foreground font-normal ml-1">（任意）</span>
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="TRPGの経験や好きなシナリオなど..."
                    rows={3}
                    disabled={saving}
                    maxLength={500}
                    className="rounded-xl bg-background/40 backdrop-blur-sm border-border/40 focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full h-11 text-sm font-medium gap-2"
                  disabled={saving || usernameStatus !== 'available' || !displayName.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      作成中...
                    </>
                  ) : (
                    <>
                      次へ
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* ── Step 2: Welcome + purchase CTA ── */
          <WelcomeStep onStart={() => router.push('/dashboard')} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// WelcomeStep
// ─────────────────────────────────────────
function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl glass-strong glass-sheen shadow-depth-3 border border-border/40 overflow-hidden">
      {/* Hero */}
      <div className="px-8 pt-8 pb-6 text-center border-b border-border/30">
        <div className="w-14 h-14 rounded-2xl glass border border-border/40 shadow-depth-2 flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400/50" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">まずは無料で試してみよう</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          アカウントを作成しました。<br />
          R&apos;lyeh Wallet はすぐに無料で使い始められます。
        </p>
      </div>

      {/* Free features */}
      <div className="px-8 py-6 border-b border-border/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          無料で使える機能
        </p>
        <ul className="space-y-3">
          {FREE_HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl glass border border-border/40 shadow-depth-1 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-foreground/70" />
              </div>
              <span className="text-sm text-foreground/80">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Wallet purchase teaser */}
      <div className="px-8 py-5 rounded-b-3xl bg-background/20">
        {/* Wallet CTA card */}
        <div className="rounded-2xl glass border border-primary/20 shadow-depth-1 p-4 mb-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl glass border border-amber-400/30 shadow-depth-1 flex items-center justify-center shrink-0 mt-0.5">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">ウォレットを手に入れる</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              画像・リンク無制限、Markdownメモ、データエクスポートが解放されます
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <Button
            className="w-full rounded-full h-11 text-sm font-medium"
            onClick={onStart}
          >
            まず無料で試す
          </Button>

          <SubscriptionCheckout
            productId={PRO_PRODUCT_ID}
            billingPeriod="monthly"
            trigger={
              <Button
                variant="outline"
                className="w-full rounded-full h-11 text-sm font-medium glass border-border/40 hover:border-primary/30 gap-2"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                ウォレットを購入する
              </Button>
            }
          />
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          後からいつでも購入できます
        </p>
      </div>
    </div>
  )
}
