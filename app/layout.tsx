import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "R'lyeh Wallet - TRPGセッション記録管理",
    template: "%s | R'lyeh Wallet",
  },
  description: 'クトゥルフ神話TRPGのセッション履歴を記録・管理・共有できるプラットフォーム',
  keywords: ['TRPG', 'クトゥルフ神話', 'CoC', 'セッション記録', 'ルルイエウォレット', 'CoC7版', 'キャラクターシート'],
  authors: [{ name: "R'lyeh Wallet" }],
  metadataBase: new URL('https://rlyehwallet.com'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://rlyehwallet.com',
    siteName: "R'lyeh Wallet",
    title: "R'lyeh Wallet - TRPGセッション記録管理",
    description: 'クトゥルフ神話TRPGのセッション履歴を記録・管理・共有できるプラットフォーム',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "R'lyeh Wallet",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "R'lyeh Wallet - TRPGセッション記録管理",
    description: 'クトゥルフ神話TRPGのセッション履歴を記録・管理・共有できるプラットフォーム',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#262626' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
