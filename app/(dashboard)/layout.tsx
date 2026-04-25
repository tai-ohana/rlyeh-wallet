import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Create profile if it doesn't exist
  if (!profile) {
    const username = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        username,
        display_name: user.user_metadata?.display_name || username,
      },
      { onConflict: 'id' }
    )
    if (upsertError) {
      console.error('[dashboard/layout] Profile upsert failed:', upsertError.message)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-ambient flex">
      {/* Left sidebar spacer — keeps content from going under the fixed sidebar */}
      <div className="hidden sm:block w-[68px] shrink-0" />

      {/* Left Sidebar - Fixed position, overlaps content */}
      <aside className="hidden sm:block fixed left-0 top-0 h-screen z-40 border-r border-border/40 glass-strong">
        <SidebarNav user={user} profile={profile} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-screen">
        <div className="px-4 sm:px-6 py-6 pb-20 sm:pb-6">
          {children}
        </div>
      </main>

      {/* Right sidebar spacer — reserves space for the fixed right sidebar on 1440px+ */}
      <div className="hidden min-[1440px]:block w-[350px] shrink-0" />

      {/* Mobile Bottom Nav */}
      <MobileNav profile={profile} />
    </div>
  )
}

// Mobile bottom navigation
function MobileNav({ profile }: { profile: any }) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border/40 z-50">
      <div className="flex items-center justify-around h-14">
        <a href="/dashboard" className="p-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </a>
        <a href="/search" className="p-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </a>
        <a href="/reports/new" className="p-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </a>
        <a href="/notifications" className="p-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </a>
        <a href={`/user/${profile?.username}`} className="p-3">
          <div className="w-7 h-7 rounded-full bg-muted overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                {(profile?.display_name || profile?.username || 'U')[0]}
              </div>
            )}
          </div>
        </a>
      </div>
    </nav>
  )
}
