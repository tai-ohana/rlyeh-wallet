'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
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
    Home,
    Search,
    Bell,
    Settings,
    LogOut,
    PenSquare,
    User,
    Crown,
    Wallet,
    Users,
    MoreHorizontal,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { springSoft } from '@/lib/motion'
import { Shimmer } from '@/components/ui/shimmer'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'

interface SidebarNavProps {
    user: SupabaseUser
    profile: Profile | null
}

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
}

export function SidebarNav({ user, profile }: SidebarNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Load saved collapse state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
            setIsCollapsed(saved === 'true')
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed))
        document.documentElement.style.setProperty('--sidebar-w', isCollapsed ? '68px' : '260px')
    }, [isCollapsed])

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

    async function handleSignOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        toast.success('ログアウトしました')
        router.push('/')
        router.refresh()
    }

    const displayName = profile?.display_name || profile?.username || 'User'
    const initials = displayName.slice(0, 2).toUpperCase()

    const navItems: NavItem[] = [
        {
            label: 'ホーム',
            href: '/dashboard',
            icon: <Home className="w-6 h-6 shrink-0" />,
        },
        {
            label: '通知',
            href: '/notifications',
            icon: <Bell className="w-6 h-6 shrink-0" />,
        },
        {
            label: '検索',
            href: '/search',
            icon: <Search className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'ウォレット',
            href: '/wallet',
            icon: <Wallet className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'シナリオDB',
            href: '/scenarios',
            icon: (
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M8 7h8M8 11h6M8 15h4" />
                </svg>
            ),
        },
        {
            label: 'ソーシャル',
            href: '/social',
            icon: <Users className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'プロフィール',
            href: `/user/${profile?.username}`,
            icon: <User className="w-6 h-6 shrink-0" />,
        },
    ]

    return (
        <>
            {/* Backdrop — only when sidebar is expanded */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 hidden sm:block"
                    onClick={() => setIsCollapsed(true)}
                />
            )}
        <nav
            className={cn(
                'flex flex-col h-full py-2 transition-all duration-300 ease-out overflow-hidden relative z-40',
                isCollapsed ? 'w-[68px] px-2' : 'w-[260px] px-3'
            )}
        >
            {/* Logo + Collapse Button */}
            <div className={cn(
                'flex items-center mb-2 p-2',
                isCollapsed ? 'justify-center' : 'justify-between'
            )}>
                {/* Logo - Not a button */}
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="R'lyeh Wallet"
                        width={32}
                        height={32}
                        className="rounded-lg shrink-0"
                    />
                    <span
                        className={cn(
                            'font-bold text-xl whitespace-nowrap transition-all duration-300',
                            isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                        )}
                    >
                        R'lyeh
                    </span>
                </div>

                {/* Collapse Button - Next to logo */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        'h-8 w-8 rounded-lg shrink-0 transition-all duration-300',
                        isCollapsed && 'absolute -right-3 top-4 bg-background border shadow-sm'
                    )}
                    title={isCollapsed ? '展開' : '折りたたむ'}
                >
                    {isCollapsed ? (
                        <PanelLeft className="w-4 h-4" />
                    ) : (
                        <PanelLeftClose className="w-4 h-4" />
                    )}
                </Button>
            </div>

            {/* Nav Items */}
            <LayoutGroup id="sidebar-nav">
                <div className="flex-1 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={isActive && item.href === '/dashboard' ? () => window.scrollTo({ top: 0, behavior: 'smooth' }) : undefined}
                                className={cn(
                                    'flex items-center gap-4 px-3 py-3 rounded-full',
                                    'group relative isolate',
                                    'hover:bg-accent/60 transition-colors duration-200',
                                    isActive && 'font-bold',
                                    isCollapsed && 'justify-center px-3'
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="sidebar-active-pill"
                                        className="absolute inset-0 -z-10 rounded-full bg-accent shadow-depth-1 ring-1 ring-primary/15"
                                        transition={springSoft}
                                    />
                                )}
                                <motion.div
                                    className="relative"
                                    whileTap={{ scale: 0.88 }}
                                    transition={{ type: 'spring', stiffness: 600, damping: 24 }}
                                >
                                    {item.icon}
                                    <AnimatePresence>
                                        {item.label === '通知' && unreadCount > 0 && (
                                            <motion.span
                                                key={unreadCount}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                                            >
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                                <span
                                    className={cn(
                                        'text-xl whitespace-nowrap transition-all duration-300',
                                        isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </LayoutGroup>

            {/* New Post Button */}
            <Link href="/reports/new" className="my-4">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                >
                    <Button
                        className={cn(
                            'relative h-12 rounded-full font-bold shadow-lg overflow-hidden transition-[background,box-shadow] duration-300',
                            'hover:shadow-primary/30',
                            isCollapsed ? 'w-12 p-0' : 'w-full text-lg'
                        )}
                        size="lg"
                        title={isCollapsed ? '投稿' : undefined}
                    >
                        <Shimmer color="rgba(255,255,255,0.45)" duration="3.8s" />
                        <PenSquare className="relative w-5 h-5 shrink-0" />
                        <span
                            className={cn(
                                'relative ml-2 whitespace-nowrap transition-all duration-300',
                                isCollapsed ? 'w-0 opacity-0 overflow-hidden ml-0' : 'w-auto opacity-100'
                            )}
                        >
                            投稿
                        </span>
                    </Button>
                </motion.div>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-full hover:bg-accent transition-colors w-full',
                            isCollapsed && 'justify-center p-2'
                        )}
                    >
                        <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                'flex flex-1 flex-col items-start min-w-0 whitespace-nowrap transition-all duration-300',
                                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                            )}
                        >
                            <span className="font-bold text-sm truncate max-w-full">{displayName}</span>
                            <span className="text-sm text-muted-foreground truncate max-w-full">@{profile?.username}</span>
                        </div>
                        <MoreHorizontal
                            className={cn(
                                'w-5 h-5 text-muted-foreground shrink-0 transition-all duration-300',
                                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-5 opacity-100'
                            )}
                        />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
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
        </nav>
        </>
    )
}
