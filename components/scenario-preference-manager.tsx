'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ScenarioPreference, ScenarioPreferenceType, Profile } from '@/lib/types'
import { getProfileLimits, canUseFeature } from '@/lib/tier-limits'

interface ScenarioPreferenceManagerProps {
    userId: string
    profile: Profile
}

export function ScenarioPreferenceManager({ userId, profile }: ScenarioPreferenceManagerProps) {
    const [preferences, setPreferences] = useState<ScenarioPreference[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newScenario, setNewScenario] = useState('')
    const [newAuthor, setNewAuthor] = useState('')
    const [activeTab, setActiveTab] = useState<ScenarioPreferenceType>('want_to_play')
    const [suggestions, setSuggestions] = useState<string[]>([])

    const limits = getProfileLimits(profile)
    const isFree = !profile?.tier || profile.tier === 'free'

    useEffect(() => {
        fetchPreferences()
    }, [userId])

    async function fetchPreferences() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('scenario_preferences')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching preferences:', error)
        } else {
            setPreferences(data || [])
        }
        setLoading(false)
    }

    async function fetchSuggestions(query: string) {
        if (query.length < 2) {
            setSuggestions([])
            return
        }

        const supabase = createClient()
        const { data } = await supabase
            .from('play_reports')
            .select('scenario_name')
            .ilike('scenario_name', `%${query}%`)
            .limit(5)

        const uniqueNames = [...new Set(data?.map(r => r.scenario_name) || [])]
        setSuggestions(uniqueNames)
    }

    async function handleAdd() {
        if (!newScenario.trim()) {
            toast.error('シナリオ名を入力してください')
            return
        }

        const currentTypeCount = preferences.filter(p => p.preference_type === activeTab).length
        if (currentTypeCount >= limits.maxScenarioPreferences) {
            toast.error(`${activeTab === 'want_to_play' ? '回りたい' : '回せる'}シナリオは最大${limits.maxScenarioPreferences}件までです`)
            return
        }

        setAdding(true)
        const supabase = createClient()

        const { data, error } = await supabase
            .from('scenario_preferences')
            .insert({
                user_id: userId,
                scenario_name: newScenario.trim(),
                scenario_author: newAuthor.trim() || null,
                preference_type: activeTab,
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                toast.error('このシナリオは既に登録されています')
            } else {
                toast.error('追加に失敗しました')
            }
        } else {
            setPreferences([data, ...preferences])
            setNewScenario('')
            setNewAuthor('')
            setSuggestions([])
            toast.success('シナリオを追加しました')
        }
        setAdding(false)
    }

    async function handleDelete(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('scenario_preferences')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('削除に失敗しました')
        } else {
            setPreferences(preferences.filter(p => p.id !== id))
            toast.success('削除しました')
        }
    }

    const wantToPlayList = preferences.filter(p => p.preference_type === 'want_to_play')
    const canRunList = preferences.filter(p => p.preference_type === 'can_run')

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-500" />
                            シナリオ希望設定
                        </CardTitle>
                        <CardDescription>
                            マッチング機能で次の卓を見つけましょう
                        </CardDescription>
                    </div>
                    {isFree && (
                        <a href="/pricing" className="shrink-0 text-xs text-amber-600 border border-amber-500/40 bg-amber-500/10 rounded-md px-2 py-1 hover:bg-amber-500/20 transition-colors">
                            Proで上限UP →
                        </a>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScenarioPreferenceType)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="want_to_play">
                            回りたい ({wantToPlayList.length}/{limits.maxScenarioPreferences})
                        </TabsTrigger>
                        <TabsTrigger value="can_run">
                            回せる ({canRunList.length}/{limits.maxScenarioPreferences})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="want_to_play" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            回りたいシナリオを登録すると、そのシナリオをKPとして回した人の投稿がダッシュボードに表示されます。
                        </p>

                        {/* Add form */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    placeholder="シナリオ名"
                                    value={newScenario}
                                    onChange={(e) => {
                                        setNewScenario(e.target.value)
                                        fetchSuggestions(e.target.value)
                                    }}
                                    disabled={wantToPlayList.length >= limits.maxScenarioPreferences}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md mt-1">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                                onClick={() => {
                                                    setNewScenario(s)
                                                    setSuggestions([])
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="著者名（任意）"
                                    value={newAuthor}
                                    onChange={(e) => setNewAuthor(e.target.value)}
                                    disabled={wantToPlayList.length >= limits.maxScenarioPreferences}
                                />
                                <Button
                                    onClick={handleAdd}
                                    disabled={adding || wantToPlayList.length >= limits.maxScenarioPreferences}
                                >
                                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : wantToPlayList.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                回りたいシナリオがありません
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {wantToPlayList.map((pref) => (
                                    <div
                                        key={pref.id}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div>
                                            <span className="font-medium">{pref.scenario_name}</span>
                                            {pref.scenario_author && (
                                                <span className="text-sm text-muted-foreground ml-2">
                                                    / {pref.scenario_author}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(pref.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="can_run" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            回せるシナリオを登録すると、そのシナリオを回りたい人のプロフィールがダッシュボードに表示されます。
                        </p>

                        {/* Add form */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    placeholder="シナリオ名"
                                    value={newScenario}
                                    onChange={(e) => {
                                        setNewScenario(e.target.value)
                                        fetchSuggestions(e.target.value)
                                    }}
                                    disabled={canRunList.length >= limits.maxScenarioPreferences}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md mt-1">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                                onClick={() => {
                                                    setNewScenario(s)
                                                    setSuggestions([])
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="著者名（任意）"
                                    value={newAuthor}
                                    onChange={(e) => setNewAuthor(e.target.value)}
                                    disabled={canRunList.length >= limits.maxScenarioPreferences}
                                />
                                <Button
                                    onClick={handleAdd}
                                    disabled={adding || canRunList.length >= limits.maxScenarioPreferences}
                                >
                                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : canRunList.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                回せるシナリオがありません
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {canRunList.map((pref) => (
                                    <div
                                        key={pref.id}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div>
                                            <span className="font-medium">{pref.scenario_name}</span>
                                            {pref.scenario_author && (
                                                <span className="text-sm text-muted-foreground ml-2">
                                                    / {pref.scenario_author}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(pref.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
