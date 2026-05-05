import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { UserProfilePageClient } from '@/components/user-profile-page'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url, bio')
    .eq('username', username)
    .single()

  if (!profile) return {}

  const displayName = profile.display_name || profile.username
  const title = `${displayName} (@${profile.username}) — R'lyeh Wallet`
  const description = profile.bio
    ? profile.bio.slice(0, 120)
    : `${displayName}のTRPGプロフィール | R'lyeh Wallet`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url
        ? [{ url: profile.avatar_url, width: 400, height: 400, alt: displayName }]
        : [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'profile',
    },
    twitter: {
      card: profile.avatar_url ? 'summary' : 'summary_large_image',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
    },
  }
}

export default function UserProfilePage() {
  return <UserProfilePageClient />
}
