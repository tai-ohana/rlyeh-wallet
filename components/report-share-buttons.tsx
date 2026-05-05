'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link2, Check, Twitter } from 'lucide-react'
import { toast } from 'sonner'

interface ReportShareButtonsProps {
  reportId: string
  scenarioName: string
  impression?: string | null
}

export function ReportShareButtons({ reportId, scenarioName, impression }: ReportShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  function handleCopyUrl() {
    const url = `${window.location.origin}/reports/${reportId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('URLをコピーしました')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleXShare() {
    const url = `${window.location.origin}/reports/${reportId}`
    const text = impression
      ? `「${scenarioName}」を通過しました！\n\n${impression.slice(0, 80)}${impression.length > 80 ? '…' : ''}\n\n#RlyehWallet #TRPG #クトゥルフ神話TRPG`
      : `「${scenarioName}」を通過しました！ #RlyehWallet #TRPG #クトゥルフ神話TRPG`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyUrl}
        className="gap-2 bg-transparent"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        URLをコピー
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleXShare}
        className="gap-2 bg-transparent"
      >
        <Twitter className="w-4 h-4" />
        Xでシェア
      </Button>
    </div>
  )
}
