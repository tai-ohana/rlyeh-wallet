'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, X, Upload } from 'lucide-react'
import Link from 'next/link'
import { InvestigatorCard } from '@/components/investigator-card'
import type { CocofolicaCharacter, Investigator, InvestigatorStatus } from '@/lib/types'

interface FormData {
  name: string
  occupation: string
  age: string
  avatar_url: string
  backstory: string
  status: InvestigatorStatus
  tags: string[]
  san_current: string
  san_max: string
  hp_max: string
  mp_max: string
  cocofolia_data: CocofolicaCharacter | null
}

const INITIAL: FormData = {
  name: '', occupation: '', age: '', avatar_url: '', backstory: '',
  status: 'active', tags: [],
  san_current: '', san_max: '', hp_max: '', mp_max: '',
  cocofolia_data: null,
}

export default function NewInvestigatorPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [tagInput, setTagInput] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPaste, setShowPaste] = useState(false)

  // ── Cocofolia importer ──────────────────────────
  function handleCocoPaste(text: string) {
    setPasteText(text)
    if (!text.trim()) { setPasteError(''); return }
    try {
      const data = JSON.parse(text) as CocofolicaCharacter
      if (data.kind !== 'character') { setPasteError('キャラクターコマのJSONではありません'); return }
      const san = data.status?.find(s => s.label === 'SAN')
      const hp  = data.status?.find(s => s.label === 'HP')
      const mp  = data.status?.find(s => s.label === 'MP')
      setForm(f => ({
        ...f,
        name:         data.name || f.name,
        avatar_url:   data.imageUrl || f.avatar_url,
        san_current:  String(san?.value ?? f.san_current),
        san_max:      String(san?.max ?? san?.value ?? f.san_max),
        hp_max:       String(hp?.max ?? hp?.value ?? f.hp_max),
        mp_max:       String(mp?.max ?? mp?.value ?? f.mp_max),
        cocofolia_data: data,
      }))
      setPasteError('')
      toast.success('ここフォリアデータを読み込みました')
    } catch {
      setPasteError('JSONの形式が正しくありません')
    }
  }

  // ── Tags ──────────────────────────────────────
  function addTag() {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t) || form.tags.length >= 8) return
    setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }
  function removeTag(t: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))
  }

  // ── Submit ────────────────────────────────────
  async function handleSubmit() {
    if (!form.name.trim()) { toast.error('名前を入力してください'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未ログイン')

      const { data, error } = await supabase
        .from('investigators')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          occupation: form.occupation.trim() || null,
          age: form.age.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          backstory: form.backstory.trim() || null,
          status: form.status,
          tags: form.tags,
          san_current: form.san_current ? Number(form.san_current) : null,
          san_max: form.san_max ? Number(form.san_max) : null,
          hp_max: form.hp_max ? Number(form.hp_max) : null,
          mp_max: form.mp_max ? Number(form.mp_max) : null,
          cocofolia_data: form.cocofolia_data,
        })
        .select()
        .single()

      if (error) throw error
      toast.success('探索者を登録しました')
      router.push(`/investigators/${data.id}`)
    } catch (e) {
      toast.error('保存に失敗しました')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // ── Preview investigator object ───────────────
  const preview: Investigator = {
    id: 'preview',
    user_id: '',
    name: form.name || '名前未入力',
    occupation: form.occupation || null,
    age: form.age || null,
    avatar_url: form.avatar_url || null,
    backstory: form.backstory || null,
    status: form.status,
    tags: form.tags,
    san_current: form.san_current ? Number(form.san_current) : null,
    san_max: form.san_max ? Number(form.san_max) : null,
    hp_max: form.hp_max ? Number(form.hp_max) : null,
    mp_max: form.mp_max ? Number(form.mp_max) : null,
    cocofolia_data: null,
    display_order: 0,
    created_at: '',
    updated_at: '',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/investigators">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold">探索者を追加</h1>
      </div>

      {/* Cocofolia import */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <button
            onClick={() => setShowPaste(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Sparkles className="w-4 h-4" />
            ここフォリアからインポート（任意）
            <span className="text-xs text-muted-foreground font-normal ml-1">
              — キャラシ出力ボタンのJSONをペースト
            </span>
          </button>

          {showPaste && (
            <div className="space-y-2">
              <Textarea
                value={pasteText}
                onChange={e => handleCocoPaste(e.target.value)}
                placeholder={'{\n  "kind": "character",\n  "name": "田中一郎",\n  ...\n}'}
                className="font-mono text-xs h-32 bg-background/60 resize-none"
              />
              {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
              {form.cocofolia_data && (
                <p className="text-xs text-emerald-500">✓ 名前・HP/MP/SAN・画像を読み込み済み</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-6 items-start">
        {/* Form */}
        <div className="space-y-5">
          {/* Status */}
          <div className="space-y-1.5">
            <Label>ステータス</Label>
            <div className="flex gap-2">
              {(['active', 'lost', 'retired'] as InvestigatorStatus[]).map(s => {
                const labels = { active: '生存', lost: 'ロスト', retired: '引退' }
                return (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.status === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {labels[s]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">探索者名 <span className="text-destructive">*</span></Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="田中一郎" />
          </div>

          {/* Occupation + Age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="occupation">職業</Label>
              <Input id="occupation" value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="私立探偵" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">年齢</Label>
              <Input id="age" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="28" />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1.5">
            <Label>ステータス</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'hp_max', label: 'HP最大' },
                { key: 'mp_max', label: 'MP最大' },
                { key: 'san_current', label: 'SAN現在' },
                { key: 'san_max', label: 'SAN最大' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="h-8 text-sm"
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <Label htmlFor="avatar_url">立ち絵 / アイコンURL</Label>
            <Input id="avatar_url" value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>タグ</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="好きなシナリオ、特徴など"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="bg-transparent">追加</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Backstory */}
          <div className="space-y-1.5">
            <Label htmlFor="backstory">バックストーリー・メモ</Label>
            <Textarea
              id="backstory"
              value={form.backstory}
              onChange={e => setForm(f => ({ ...f, backstory: e.target.value }))}
              placeholder="この探索者について..."
              className="resize-none h-28"
            />
          </div>
        </div>

        {/* Card preview */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">プレビュー</p>
          <div className="w-40 mx-auto">
            <InvestigatorCard investigator={preview} href="#" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end pt-2">
        <Link href="/investigators">
          <Button variant="outline" className="bg-transparent">キャンセル</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
          {saving ? '保存中...' : '探索者を登録'}
        </Button>
      </div>
    </div>
  )
}
