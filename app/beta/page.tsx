'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
    BookOpen,
    Users,
    BarChart3,
    Shield,
    Mail,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/* ============================================================
   BETA LANDING PAGE — R'lyeh Wallet
   Dark-themed, Cthulhu-inspired beta signup page
   ============================================================ */

// ─── Color Palette (matching flyer aesthetic) ────────────────
const C = {
    bg: '#0a0a0a',
    bgCard: '#141414',
    bgCardHover: '#1a1a1a',
    gold: '#c4a35a',
    goldLight: '#e8d5a3',
    goldDim: '#8a7340',
    text: '#e8e8e8',
    textMuted: '#888888',
    textDim: '#555555',
    border: '#222222',
    borderGold: '#c4a35a33',
}

// ─── Floating Particles ─────────────────────────────────────
function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(16)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: i % 3 === 0 ? 3 : 2,
                        height: i % 3 === 0 ? 3 : 2,
                        background: i % 4 === 0 ? C.gold : C.textDim,
                        left: `${(i * 6.25) % 100}%`,
                        top: `${(i * 7.13) % 100}%`,
                    }}
                    animate={{
                        y: [0, -80, 0],
                        x: [0, Math.sin(i * 1.5) * 15, 0],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: 7 + (i % 4) * 2,
                        repeat: Infinity,
                        delay: (i * 0.7) % 5,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    )
}

// ─── Elder Sign SVG ──────────────────────────────────────────
function ElderSign({ className, delay }: { className: string; delay: number }) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            className={className}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: [0, 0.08, 0.04, 0.08, 0], rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, delay, ease: 'linear' }}
        >
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <polygon
                points="50,12 61,38 90,38 67,56 76,84 50,66 24,84 33,56 10,38 39,38"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
            />
            <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
        </motion.svg>
    )
}

// ─── Section 1: Hero ─────────────────────────────────────────
function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Multi-layered spotlight background */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, ${C.gold}15 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 30% 20%, ${C.gold}08 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 70% 20%, ${C.gold}08 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 50% 100%, ${C.gold}06 0%, transparent 50%),
            ${C.bg}
          `,
                }}
            />

            <Particles />

            {/* Elder signs */}
            <ElderSign className="absolute top-[12%] left-[6%] w-24 md:w-32" delay={0} style-color={C.goldDim} />
            <ElderSign className="absolute bottom-[18%] right-[8%] w-20 md:w-28" delay={7} style-color={C.textDim} />

            {/* Content */}
            <div className="container mx-auto px-4 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="mb-8"
                    >
                        <Image
                            src="/logo.png"
                            alt="R'lyeh Wallet"
                            width={100}
                            height={100}
                            className="mx-auto rounded-2xl"
                            style={{
                                filter: `drop-shadow(0 0 40px ${C.gold}40)`,
                            }}
                        />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
                        style={{ color: C.text }}
                    >
                        {"R'lyeh Wallet"}
                    </motion.h1>

                    {/* Beta badge */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mb-6"
                    >
                        <span
                            className="inline-block text-lg md:text-xl font-bold tracking-widest px-6 py-2 rounded-full border"
                            style={{
                                color: C.gold,
                                borderColor: C.borderGold,
                                background: `${C.gold}10`,
                            }}
                        >
                            β版ユーザー募集中
                        </span>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
                        style={{ color: C.textMuted }}
                    >
                        クトゥルフ神話TRPGの通過報告を、綺麗に保存＆シェアできる
                        <br className="hidden md:block" />
                        新しいサービス、R&apos;lyeh Wallet略して「るるウォレット」
                        <br className="hidden md:block" />
                        自分の通過記録を整理して、他の探索者たちの通過報告も読める
                        <br className="hidden md:block" />
                        ギャラリー型プラットフォームです。
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <Link href="#signup">
                            <Button
                                size="lg"
                                className="font-bold text-base px-10 py-6 h-auto rounded-xl cursor-pointer"
                                style={{
                                    background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
                                    color: C.bg,
                                }}
                            >
                                ベータ版に参加する
                                <ArrowDown className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <span className="text-xs" style={{ color: C.textDim }}>
                            無料 · メールアドレスのみで登録
                        </span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom gradient */}
            <div
                className="absolute bottom-0 left-0 right-0 h-32"
                style={{
                    background: `linear-gradient(to top, ${C.bg}, transparent)`,
                }}
            />
        </section>
    )
}

// ─── Section 2: Feature Screenshots ─────────────────────────
const screenshots = [
    {
        src: '/beta/screenshot-dashboard.png',
        alt: 'ダッシュボード画面',
        caption: 'タイムラインで仲間の通過報告をチェック',
        sub: 'フレンドやフォロー中の探索者の最新記録が流れてくるホーム画面',
    },
    {
        src: '/beta/screenshot-profile.png',
        alt: 'プロフィール画面',
        caption: 'あなたのTRPG人生を美しいウォレットに',
        sub: '総セッション数、KP/PL回数、生存率…あなたのプレイ統計がひと目で',
    },
    {
        src: '/beta/screenshot-create.png',
        alt: 'レポート作成画面',
        caption: 'シンプルなフォームで記録を作成',
        sub: 'シナリオ名、参加者、結果をサクッと入力。画像も添付できます',
    },
]

function ScreenshotsSection() {
    const [current, setCurrent] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const prev = () => setCurrent((c) => (c === 0 ? screenshots.length - 1 : c - 1))
    const next = () => setCurrent((c) => (c === screenshots.length - 1 ? 0 : c + 1))

    return (
        <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: C.bg }}>
            {/* Subtle top glow */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${C.gold}30, transparent)` }}
            />

            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-4"
                        style={{ color: C.text }}
                    >
                        こんなことができます
                    </h2>
                    <p style={{ color: C.textMuted }}>
                        仲間との冒険の余韻は、ここに残る
                    </p>
                </motion.div>

                {/* Mobile carousel */}
                <div className="md:hidden" ref={containerRef}>
                    <div className="relative">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-2xl overflow-hidden border"
                            style={{ borderColor: C.border }}
                        >
                            <div
                                className="aspect-video relative bg-cover bg-center bg-no-repeat"
                                style={{
                                    backgroundImage: `url(${screenshots[current].src})`,
                                    backgroundColor: C.bgCard,
                                }}
                            >
                                <Image
                                    src={screenshots[current].src}
                                    alt={screenshots[current].alt}
                                    fill
                                    className="object-cover object-top"
                                />
                            </div>
                            <div className="p-4" style={{ background: C.bgCard }}>
                                <p className="font-bold text-sm" style={{ color: C.goldLight }}>
                                    {screenshots[current].caption}
                                </p>
                                <p className="text-xs mt-1" style={{ color: C.textDim }}>
                                    {screenshots[current].sub}
                                </p>
                            </div>
                        </motion.div>

                        {/* Nav buttons */}
                        <div className="flex justify-center gap-3 mt-4">
                            <button
                                onClick={prev}
                                className="p-2 rounded-full border cursor-pointer"
                                style={{ borderColor: C.border, color: C.textMuted }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2">
                                {screenshots.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        className="w-2 h-2 rounded-full transition-all cursor-pointer"
                                        style={{
                                            background: i === current ? C.gold : C.textDim,
                                        }}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={next}
                                className="p-2 rounded-full border cursor-pointer"
                                style={{ borderColor: C.border, color: C.textMuted }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop grid */}
                <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {screenshots.map((shot, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="rounded-2xl overflow-hidden border group cursor-default"
                            style={{ borderColor: C.border }}
                        >
                            <div className="aspect-video relative overflow-hidden">
                                <Image
                                    src={shot.src}
                                    alt={shot.alt}
                                    fill
                                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Hover overlay */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: `linear-gradient(to top, ${C.bg}cc, transparent)`,
                                    }}
                                />
                            </div>
                            <div
                                className="p-5 transition-colors"
                                style={{ background: C.bgCard }}
                            >
                                <p className="font-bold text-sm mb-1" style={{ color: C.goldLight }}>
                                    {shot.caption}
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: C.textDim }}>
                                    {shot.sub}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─── Section 3: Feature Highlights ──────────────────────────
const features = [
    {
        icon: BookOpen,
        title: 'セッション記録',
        description: 'シナリオ名、参加者、結果など詳細な情報をシンプルなフォームで記録。画像も添付できます。',
    },
    {
        icon: Users,
        title: 'ソーシャル機能',
        description: 'フレンドと記録を共有。タイムラインで新しいシナリオを発見。共有コードで同卓者と簡単共有。',
    },
    {
        icon: BarChart3,
        title: '統計ダッシュボード',
        description: 'セッション数、KP/PL回数、生存率、プレイ時間… あなたの探索者としてのデータを自動可視化。',
    },
    {
        icon: Shield,
        title: 'プライバシー管理',
        description: '公開・フォロワー限定・非公開の3段階。ネタバレ防止も万全。安心して記録を残せます。',
    },
]

function FeaturesSection() {
    return (
        <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: C.bgCard }}>
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-4"
                        style={{ color: C.text }}
                    >
                        {"R'lyeh Walletの特徴"}
                    </h2>
                    <p style={{ color: C.textMuted }}>
                        探索者のための、すべてがここに
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{
                                y: -4,
                                transition: { duration: 0.2 },
                            }}
                            className="p-6 rounded-2xl border transition-all cursor-default"
                            style={{
                                background: C.bg,
                                borderColor: C.border,
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                style={{
                                    background: `${C.gold}15`,
                                    color: C.gold,
                                }}
                            >
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2" style={{ color: C.text }}>
                                {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─── Section 4: Beta Signup CTA ─────────────────────────────
function SignupSection() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setStatus('loading')
        try {
            const res = await fetch('/api/beta-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (res.ok) {
                setStatus('success')
                setMessage(data.message)
                setEmail('')
            } else {
                setStatus('error')
                setMessage(data.error)
            }
        } catch {
            setStatus('error')
            setMessage('通信エラーが発生しました')
        }
    }

    return (
        <section
            id="signup"
            className="py-20 md:py-28 relative overflow-hidden"
            style={{ background: C.bg }}
        >
            {/* Spotlight effect */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            radial-gradient(ellipse 50% 60% at 50% 30%, ${C.gold}12 0%, transparent 70%),
            transparent
          `,
                }}
            />

            {/* Decorative line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${C.gold}30, transparent)` }}
            />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl mx-auto text-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mb-6"
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                            style={{
                                background: `${C.gold}15`,
                                border: `1px solid ${C.borderGold}`,
                            }}
                        >
                            <Sparkles className="w-8 h-8" style={{ color: C.gold }} />
                        </div>
                    </motion.div>

                    <h2
                        className="text-2xl md:text-4xl font-bold mb-4"
                        style={{ color: C.text }}
                    >
                        深淵の探索者として、
                        <br />
                        歴史に名を刻め
                    </h2>

                    <p className="text-sm mb-2" style={{ color: C.textMuted }}>
                        メールアドレスを登録すると、ベータ版の公開時にお知らせいたします。
                    </p>
                    <p className="text-xs mb-8" style={{ color: C.goldDim }}>
                        🐙 ベータ版参加者限定「深淵の探索者」バッジをプレゼント
                    </p>

                    {status === 'success' ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 rounded-2xl border"
                            style={{
                                background: `${C.gold}10`,
                                borderColor: C.borderGold,
                            }}
                        >
                            <CheckCircle2
                                className="w-12 h-12 mx-auto mb-3"
                                style={{ color: C.gold }}
                            />
                            <p className="font-bold mb-1" style={{ color: C.goldLight }}>
                                登録ありがとうございます！
                            </p>
                            <p className="text-sm" style={{ color: C.textMuted }}>
                                {message}
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <div className="flex-1 relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                    style={{ color: C.textDim }}
                                />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-12 rounded-xl border text-sm"
                                    style={{
                                        background: C.bgCard,
                                        borderColor: C.border,
                                        color: C.text,
                                    }}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={status === 'loading'}
                                className="h-12 px-6 rounded-xl font-bold text-sm cursor-pointer"
                                style={{
                                    background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
                                    color: C.bg,
                                }}
                            >
                                {status === 'loading' ? '送信中...' : '登録する'}
                            </Button>
                        </form>
                    )}

                    {status === 'error' && (
                        <p className="text-sm mt-3" style={{ color: '#ef4444' }}>
                            {message}
                        </p>
                    )}

                    <p className="text-xs mt-6" style={{ color: C.textDim }}>
                        ※ 無料でご利用いただけます · メールアドレスは本サービスのお知らせにのみ使用します
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

// ─── Section 5: Footer ──────────────────────────────────────
function BetaFooter() {
    return (
        <footer
            className="py-8 border-t"
            style={{
                background: C.bgCard,
                borderColor: C.border,
            }}
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="R'lyeh Wallet"
                            width={24}
                            height={24}
                            className="rounded"
                        />
                        <span className="text-sm" style={{ color: C.textDim }}>
                            {"R'lyeh Wallet"}
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm" style={{ color: C.textDim }}>
                        <Link
                            href="/legal/terms"
                            className="transition-colors hover:opacity-80"
                        >
                            利用規約
                        </Link>
                        <Link
                            href="/legal/privacy"
                            className="transition-colors hover:opacity-80"
                        >
                            プライバシーポリシー
                        </Link>
                        <Link
                            href="/contact"
                            className="transition-colors hover:opacity-80"
                        >
                            お問い合わせ
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

// ─── Main Page ───────────────────────────────────────────────
export default function BetaLandingPage() {
    return (
        <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
            {/* Fixed header */}
            <header
                className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
                style={{
                    background: `${C.bg}cc`,
                    borderColor: C.border,
                }}
            >
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/beta" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="R'lyeh Wallet"
                            width={28}
                            height={28}
                            className="rounded-lg"
                        />
                        <span className="font-bold text-sm tracking-tight" style={{ color: C.text }}>
                            {"R'lyeh Wallet"}
                        </span>
                        <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                                background: `${C.gold}20`,
                                color: C.gold,
                            }}
                        >
                            BETA
                        </span>
                    </Link>
                    <Link href="#signup">
                        <Button
                            size="sm"
                            className="font-bold text-xs cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
                                color: C.bg,
                            }}
                        >
                            事前登録
                        </Button>
                    </Link>
                </div>
            </header>

            <HeroSection />
            <ScreenshotsSection />
            <FeaturesSection />
            <SignupSection />
            <BetaFooter />
        </div>
    )
}
