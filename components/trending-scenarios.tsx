'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react'

interface TrendingScenario {
    name: string
    author: string | null
    count: number
    trend: 'up' | 'new' | 'stable'
}

interface TrendingScenariosProps {
    scenarios: TrendingScenario[]
    isMeasuring?: boolean
    measurementDay?: number
}

export function TrendingScenarios({ scenarios, isMeasuring, measurementDay }: TrendingScenariosProps) {
    const showMeasuring = isMeasuring || scenarios.length === 0

    return (
        <div className="rounded-2xl glass glass-sheen shadow-depth-1 p-4 mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-foreground/90">
                <Flame className="w-4 h-4 text-orange-500" />
                今月のトレンド
            </h3>
            {showMeasuring ? (
                <div className="py-4 space-y-4">
                    {/* Measuring animation */}
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <BarChart3 className="w-5 h-5 animate-pulse text-orange-500" />
                        <span className="text-sm font-medium">集計中...</span>
                    </div>
                    {isMeasuring ? (
                        <>
                            {/* Progress bar for first 3 days */}
                            <div className="space-y-2">
                                <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
                                        style={{ width: `${((measurementDay || 1) / 3) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                    {measurementDay || 1}日目 / 3日間
                                </p>
                            </div>
                            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                                今月の記録を集計しています。<br />
                                4日以降にランキングが表示されます。
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground leading-relaxed">
                            今月はまだ記録がありません。<br />
                            セッションが記録されるとランキングが表示されます。
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-1">
                    {scenarios.slice(0, 5).map((scenario, index) => {
                        const isTop3 = index < 3
                        const rankTone =
                            index === 0
                                ? 'text-amber-500'
                                : index === 1
                                    ? 'text-foreground/70'
                                    : index === 2
                                        ? 'text-orange-500'
                                        : 'text-muted-foreground'
                        return (
                            <Link
                                key={scenario.name}
                                href={`/search?q=${encodeURIComponent(scenario.name)}`}
                                className="flex items-center gap-3 -mx-1.5 px-1.5 py-1.5 rounded-xl hover:bg-background/50 transition-colors group"
                            >
                                {/* Rank pill — glass with foreground number */}
                                <span
                                    className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-xl shrink-0 tabular-nums ${isTop3
                                        ? `glass border border-border/40 shadow-depth-1 ${rankTone}`
                                        : 'text-muted-foreground'}`}
                                >
                                    {index + 1}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                        {scenario.name}
                                    </p>
                                    {scenario.author && (
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {scenario.author}
                                        </p>
                                    )}
                                </div>

                                {/* Trend indicator */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {scenario.trend === 'new' && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                                            NEW
                                        </Badge>
                                    )}
                                    {scenario.trend === 'up' && (
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {scenario.count}件
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
