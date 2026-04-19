import Image from 'next/image'
import Link from 'next/link'
import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Atmospheric radial backdrop — ccfolia-inspired cosmic depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, color-mix(in oklch, var(--primary) 6%, transparent) 0%, transparent 70%)',
        }}
      />
      {/* Faint grid overlay for structure */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          color: 'var(--foreground)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo & Branding */}
        <div className="flex justify-center mb-8 motion-safe:animate-fade-in-up">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="R'lyeh Wallet"
              width={48}
              height={48}
              className="rounded-xl"
            />
            <span className="font-bold text-xl tracking-tight">{"R'lyeh Wallet"}</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="motion-safe:animate-fade-in-up motion-safe:[animation-delay:100ms]">
          {children}
        </div>

        {/* Footer Link */}
        {title === 'ログイン' && (
          <p className="mt-6 text-center text-sm text-muted-foreground motion-safe:animate-fade-in-up motion-safe:[animation-delay:200ms]">
            アカウントをお持ちでない方は
            <Link href="/auth/sign-up" className="text-primary hover:underline ml-1">
              新規登録
            </Link>
          </p>
        )}
        {title === '新規登録' && (
          <p className="mt-6 text-center text-sm text-muted-foreground motion-safe:animate-fade-in-up motion-safe:[animation-delay:200ms]">
            既にアカウントをお持ちの方は
            <Link href="/auth/login" className="text-primary hover:underline ml-1">
              ログイン
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
