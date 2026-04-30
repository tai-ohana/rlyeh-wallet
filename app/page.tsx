'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/lp/hero-section'
import { SampleCardPreview } from '@/components/lp/sample-card-preview'
import { HowItWorks } from '@/components/lp/how-it-works'
import { FeaturesGrid } from '@/components/lp/features-grid'
import { SocialProof } from '@/components/lp/social-proof'
import { CTASection } from '@/components/lp/cta-section'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-lp-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-lp-200/60 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="R'lyeh Wallet"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-lg tracking-tight text-lp-900">
              {"R'lyeh Wallet"}
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="#features" className="hidden sm:block text-sm text-lp-500 hover:text-lp-900 transition-colors">
              機能
            </Link>
            <Link href="/auth/login">
              <Button
                size="sm"
                className="bg-lp-900 text-white hover:bg-lp-800 font-bold"
              >
                ログイン / 登録
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Sample Card Preview — Key conversion element */}
      <SampleCardPreview />

      {/* How It Works — GSAP scrollytelling */}
      <HowItWorks />

      {/* Social Proof — Testimonial placeholder */}
      <SocialProof />

      {/* Features Grid — Bento layout with hover effects */}
      <FeaturesGrid />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-lp-200 py-8 bg-lp-50">
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
              <span className="text-sm text-lp-400">
                {"R'lyeh Wallet"}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-lp-400">
              <Link
                href="/legal/terms"
                className="hover:text-lp-900 transition-colors"
              >
                利用規約
              </Link>
              <Link
                href="/legal/privacy"
                className="hover:text-lp-900 transition-colors"
              >
                プライバシーポリシー
              </Link>
              <Link
                href="/contact"
                className="hover:text-lp-900 transition-colors"
              >
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
