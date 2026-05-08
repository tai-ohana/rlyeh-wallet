import Link from 'next/link'
import Image from 'next/image'
import type { Investigator, InvestigatorStatus } from '@/lib/types'

interface InvestigatorCardProps {
  investigator: Investigator
  sessionCount?: number
  href?: string
}

const STATUS_CONFIG: Record<InvestigatorStatus, { label: string; dot: string; pill: string }> = {
  active:  { label: '生存', dot: 'bg-emerald-400', pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lost:    { label: 'ロスト', dot: 'bg-red-400',   pill: 'bg-red-500/20 text-red-300 border-red-500/30' },
  retired: { label: '引退', dot: 'bg-zinc-400',    pill: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

export function InvestigatorCard({ investigator, sessionCount, href }: InvestigatorCardProps) {
  const status = STATUS_CONFIG[investigator.status]
  const count = sessionCount ?? investigator.session_count ?? 0
  const dest = href ?? `/investigators/${investigator.id}`

  return (
    <Link href={dest} className="group block">
      {/* Aspect ratio: 2/3 (TCGカード縦型) */}
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/40 group-hover:border-white/20">

        {/* Character image */}
        {investigator.avatar_url ? (
          <Image
            src={investigator.avatar_url}
            alt={investigator.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 via-zinc-800 to-zinc-900">
            <span className="text-5xl font-bold text-white/20 select-none">
              {investigator.name.slice(0, 1)}
            </span>
          </div>
        )}

        {/* Gradient overlay — bottom-heavy */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {/* Status pill — top right */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          {/* Name */}
          <p className="font-bold text-white text-sm leading-snug line-clamp-1 drop-shadow-md">
            {investigator.name}
          </p>

          {/* Occupation */}
          {investigator.occupation && (
            <p className="text-white/55 text-xs line-clamp-1">
              {investigator.occupation}
            </p>
          )}

          {/* Tags + session count */}
          <div className="flex items-end justify-between gap-1 pt-0.5">
            <div className="flex flex-wrap gap-1 min-w-0">
              {investigator.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 leading-none whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
            {count > 0 && (
              <span className="text-[10px] text-white/35 shrink-0 whitespace-nowrap">
                {count}本
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
