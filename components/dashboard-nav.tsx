'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Wallet, 
  Users,
  Settings,
  LogOut,
  Plus,
  Bell,
  Crown,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'

// Icon components for cleaner nav
function CardStackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="14" height="10" rx="2" />
      <path d="M7 3h10a2 2 0 0 1 2 2v10" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M17 14a4 4 0 0 1 4 4v3" />
    </svg>
  )
}

// ─── NavItem helper ───────────────────────────────
function NavItem({
  href,
  active,
  label,
  children,
}: {
  href: string
  active: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} title={label}>
      <button
        type="button"
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150',
          'hover:bg-accent active:scale-95',
          active
            ? 'text-primary bg-primary/15 ring-1 ring-primary/20'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {children}
        {active && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>
    </Link>
  )
}
// ──────────────────────────────────────────────────

interface DashboardNavProps {
  user: SupabaseUser
  profile: Profile | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnreadCount() {
      const supabase = createClient()
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // Set up realtime subscription for notifications
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  // Immediately clear badge when on notifications page; refetch when leaving
  useEffect(() => {
    if (pathname.startsWith('/notifications')) {
      setUnreadCount(0)
    } else {
      const timer = setTimeout(async () => {
        const supabase = createClient()
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        setUnreadCount(count || 0)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname, user.id])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('ログアウトしました')
    router.push('/')
    router.refresh()
  }

  const displayName = profile?.display_name || profile?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Image
            src="/logo.png"
            alt="R'lyeh Wallet"
            width={36}
            height={36}
            className="rounded-xl transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Right side - Icon Navigation */}
        <nav className="flex items-center gap-0.5">
          {/* New Record Button */}
          <Link href="/reports/new">
            <button
              type="button"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">記録</span>
            </button>
          </Link>

          <div className="w-px h-5 bg-border/60 mx-1.5" />

          {/* My Wallet / Cards */}
          <NavItem href="/wallet" active={pathname.startsWith('/wallet')} label="ウォレット">
            <CardStackIcon className="w-5 h-5" />
          </NavItem>

          {/* Search */}
          <NavItem href="/search" active={pathname.startsWith('/search')} label="検索">
            <Search className="w-5 h-5" />
          </NavItem>

          {/* Social - Friends & Following */}
          <NavItem href="/social" active={pathname.startsWith('/social')} label="フレンド">
            <UsersIcon className="w-5 h-5" />
          </NavItem>

          {/* Notifications */}
          <NavItem href="/notifications" active={pathname.startsWith('/notifications')} label="通知">
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </NavItem>

          <div className="w-px h-5 bg-border/60 mx-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-accent transition-colors duration-150 group"
              >
                <Avatar className="w-7 h-7 rounded-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="rounded-lg" />
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] rounded-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground/80 group-hover:text-foreground max-w-[80px] truncate">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/user/${profile?.username}`} className="cursor-pointer">
                  <Wallet className="w-4 h-4 mr-2" />
                  マイプロフィール
                </Link>
              </DropdownMenuItem>
              {(!profile?.tier || profile.tier === 'free') && (
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <Crown className="w-4 h-4 mr-2" />
                    ウォレットを購入
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
