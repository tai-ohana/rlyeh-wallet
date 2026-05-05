import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Image src="/logo.png" alt="R'lyeh Wallet" width={28} height={28} />
            <span className="font-bold text-sm hidden sm:block">R&apos;lyeh Wallet</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="bg-transparent text-xs">
                  ダッシュボードへ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    ログイン
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-xs">
                    無料で始める
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
