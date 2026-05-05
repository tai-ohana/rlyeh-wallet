'use client'

import { forwardRef } from 'react'
import type { Profile, PlayReport, ScenarioPreference } from '@/lib/types'
import { getRolePreferenceLabel } from '@/lib/trpg-preferences'

interface ProfileCardExportProps {
  profile: Profile
  stats: {
    totalSessions: number
    asKP: number
    asPL: number
    uniqueScenarios: number
    totalHours: number
    survivalRate: number
  }
  favoriteReports: PlayReport[]
  wantToPlayScenarios?: ScenarioPreference[]
}

const CARD_W = 1080
const CARD_H = 1440

// Fixed taxonomy of scenario preference tags (4 cols x 6 rows)
const SCENARIO_PREFERENCE_PRESETS: string[][] = [
  ['クラシック', '秘匿HO', 'PvP', '高ロスト', 'ホラー', 'シティ'],
  ['コメディ', 'クローズド', 'エモ', '恋愛・うちよそ', '1〜2PL', '3PL以上'],
  ['戦闘', '推理・考察', '茶番', 'RP', 'CS練り', '感情表現'],
  ['友情', '恋愛', 'バディ', 'NL', 'BL', 'GL'],
]

export const ProfileCardExport = forwardRef<HTMLDivElement, ProfileCardExportProps>(
  function ProfileCardExport({ profile, stats, favoriteReports }, ref) {
    const displayName = profile.display_name || profile.username
    const initial = displayName.charAt(0).toUpperCase()

    // Always render exactly 3 favorite slots (placeholders for empty)
    const favoriteSlots: (PlayReport | null)[] = [
      favoriteReports[0] || null,
      favoriteReports[1] || null,
      favoriteReports[2] || null,
    ]

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          background: '#f5f5f5',
          padding: 40,
          fontFamily:
            '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif',
          color: '#1f2937',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* ─── Row 1: Avatar+Name | Scenario Tags | GM/PL ─── */}
        <div style={{ display: 'flex', gap: 20, height: 280 }}>
          {/* Avatar + Name (vertical stack) */}
          <Section style={{ width: 280, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Avatar avatarUrl={profile.avatar_url} initial={initial} />
            <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{profile.username}
              </div>
              {(profile.tier === 'streamer' || profile.tier === 'pro') && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                  <TierPill
                    label={profile.tier === 'streamer' ? '配信者' : 'Pro'}
                    color={profile.tier === 'streamer' ? '#a855f7' : '#3b82f6'}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Scenario tags (instead of プレイ傾向) */}
          <Section style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <SectionTitle icon="🎮" title="好きな傾向" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', minHeight: 0, overflow: 'hidden' }}>
              {(profile.scenario_tags?.length ?? 0) > 0 ? (
                <TagWrap>
                  {profile.scenario_tags.map((t) => (
                    <Tag key={t} label={t} variant="solid" />
                  ))}
                </TagWrap>
              ) : (
                <EmptyHint text="未設定" />
              )}
            </div>
          </Section>

          {/* GM/PL preference */}
          <Section style={{ width: 320, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <SectionTitle icon="👥" title="GM/PL 傾向" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <RolePreferenceBar value={profile.role_preference} />
            </div>
          </Section>
        </div>

        {/* ─── Row 2: Bio | Stats ─── */}
        <div style={{ display: 'flex', gap: 20, height: 240 }}>
          <Section style={{ width: 280, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <SectionTitle icon="👤" title="自己紹介" />
            <div
              style={{
                fontSize: 14,
                color: '#4b5563',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 7,
                flex: 1,
              }}
            >
              {profile.bio || '—'}
            </div>
          </Section>

          <Section style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <SectionTitle icon="📊" title="統計" subtitle="R'lyeh Wallet から取得" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, flex: 1, alignContent: 'center' }}>
              <StatBox label="総セッション" value={stats.totalSessions.toString()} suffix="回" />
              <StatBox label="生還率" value={stats.survivalRate.toString()} suffix="%" />
              <StatBox label="総プレイ時間" value={stats.totalHours.toFixed(0)} suffix="h" />
              <StatBox label="KP回数" value={stats.asKP.toString()} suffix="回" />
              <StatBox label="PL回数" value={stats.asPL.toString()} suffix="回" />
            </div>
          </Section>
        </div>

        {/* ─── Row 3: TRPG設定 (favorites + play style) ─── */}
        <Section style={{ height: 320, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle icon="📦" title="TRPG設定" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
            {/* Favorite scenarios — always 3 slots */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <SubLabel text="好きなシナリオ（最大3つ）" />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  alignItems: 'start',
                }}
              >
                {favoriteSlots.map((report, idx) =>
                  report ? <ScenarioCard key={report.id} report={report} /> : <ScenarioPlaceholder key={`empty-${idx}`} />
                )}
              </div>
            </div>

            {/* Play style */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <SubLabel text="得意な遊び方" />
              {(profile.play_style_tags?.length ?? 0) > 0 || profile.play_style_other ? (
                <TagWrap>
                  {profile.play_style_tags?.map((t) => (
                    <Tag key={t} label={t} variant="solid" />
                  ))}
                  {profile.play_style_other && <Tag label={profile.play_style_other} variant="outline" />}
                </TagWrap>
              ) : (
                <EmptyHint text="未設定" />
              )}
            </div>

          </div>
        </Section>

        {/* ─── Row 4: 好きなシナリオ傾向 (4-col checkbox list) ─── */}
        <Section style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionTitle icon="❤" title="好きなシナリオ傾向" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              flex: 1,
              minHeight: 0,
            }}
          >
            {SCENARIO_PREFERENCE_PRESETS.map((column, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {column.map((label) => {
                  const checked = (profile.scenario_tags ?? []).some(
                    (t) => t.toLowerCase() === label.toLowerCase()
                  )
                  return <Checkbox key={label} label={label} checked={checked} />
                })}
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Footer ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#9ca3af',
            fontSize: 13,
            paddingTop: 4,
          }}
        >
          <div style={{ fontWeight: 700, color: '#6b7280' }}>R&apos;lyeh Wallet</div>
          <div>rlyehwallet.com/user/{profile.username}</div>
        </div>
      </div>
    )
  }
)

// ─── Sub components ────────────────────────────────

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 24,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexShrink: 0 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>({subtitle})</span>}
    </div>
  )
}

function SubLabel({ text }: { text: string }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, flexShrink: 0 }}>{text}</div>
}

function Avatar({ avatarUrl, initial }: { avatarUrl: string | null; initial: string }) {
  return (
    <div
      style={{
        width: 160,
        height: 160,
        borderRadius: 28,
        overflow: 'hidden',
        flexShrink: 0,
        background: '#e5e7eb',
        position: 'relative',
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 72,
            fontWeight: 700,
            color: '#9ca3af',
            lineHeight: 1,
          }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

function TierPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 999,
        background: color,
        color: '#fff',
      }}
    >
      {label}
    </span>
  )
}

function StatBox({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        borderRadius: 12,
        padding: '14px 8px',
        textAlign: 'center',
        border: '1px solid #f3f4f6',
      }}
    >
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
        {value}
        {suffix && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginLeft: 1 }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

function Tag({ label, variant }: { label: string; variant: 'solid' | 'outline' | 'emerald' }) {
  const styles =
    variant === 'emerald'
      ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
      : variant === 'outline'
      ? { background: 'transparent', color: '#374151', border: '1px solid #d1d5db' }
      : { background: '#f3f4f6', color: '#374151', border: '1px solid transparent' }
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 8,
        ...styles,
      }}
    >
      {label}
    </div>
  )
}

function TagWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>{children}</div>
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        border: '1px dashed #e5e7eb',
        borderRadius: 12,
        color: '#9ca3af',
        fontSize: 13,
        minHeight: 60,
      }}
    >
      {text}
    </div>
  )
}

function ScenarioCard({ report }: { report: PlayReport }) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        aspectRatio: '3 / 4',
      }}
    >
      {report.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={report.cover_image_url}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          padding: 8,
          background: report.cover_image_url
            ? 'linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 70%)'
            : 'transparent',
          color: report.cover_image_url ? '#ffffff' : '#1f2937',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {report.scenario_name}
      </div>
    </div>
  )
}

function Checkbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: checked ? '2px solid #111827' : '1.5px solid #d1d5db',
          background: checked ? '#111827' : '#ffffff',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {checked && '✓'}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: checked ? 700 : 500,
          color: checked ? '#111827' : '#9ca3af',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function ScenarioPlaceholder() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px dashed #e5e7eb',
        background: '#fafafa',
        aspectRatio: '3 / 4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#d1d5db',
        fontSize: 11,
      }}
    >
      —
    </div>
  )
}

function RolePreferenceBar({ value }: { value: 'pl_main' | 'gm_main' | 'both' | null }) {
  const position = value === 'gm_main' ? 0 : value === 'both' ? 50 : value === 'pl_main' ? 100 : 50
  const label = value ? getRolePreferenceLabel(value) : '未設定'
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        <span style={{ color: '#374151' }}>GM</span>
        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#374151' }}>PL</span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 8,
          background: '#e5e7eb',
          borderRadius: 999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: `calc(${position}% - 10px)`,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#111827',
            border: '3px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  )
}
