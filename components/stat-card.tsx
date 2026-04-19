import React from "react"
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
}

export default function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="glass glass-sheen shadow-depth-1 border-border/30 rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
