import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/sidebar-nav'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ログイン済みならダッシュボードと同じサイドバーレイアウトで表示
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return (
      <div className="min-h-screen bg-background bg-ambient flex">
        <div className="hidden sm:block w-[68px] shrink-0" />
        <aside className="hidden sm:block fixed left-0 top-0 h-screen z-40 border-r border-border/40 glass-strong">
          <SidebarNav user={user} profile={profile} />
        </aside>
        <main className="flex-1 min-w-0 min-h-screen">
          <div className="px-4 sm:px-6 py-6 pb-20 sm:pb-6">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // 未ログインは公開ヘッダーのみ
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="R'lyeh Wallet" width={28} height={28} />
            <span className="font-bold text-sm hidden sm:block">R&apos;lyeh Wallet</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs">ログイン</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="text-xs">無料で始める</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
