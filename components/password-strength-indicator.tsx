import { useMemo } from 'react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }

    let score = 0
    if (password.length >= 8) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1

    if (score <= 1) return { score, label: '弱い', color: 'bg-destructive' }
    if (score <= 2) return { score, label: '普通', color: 'bg-yellow-500' }
    return { score: 3, label: '強い', color: 'bg-green-500' }
  }, [password])

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">パスワード強度</span>
        <span className={`text-xs font-medium ${
          strength.color === 'bg-destructive' ? 'text-destructive' :
          strength.color === 'bg-yellow-500' ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${(strength.score / 3) * 100}%` }}
        />
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className={password.length >= 8 ? 'text-primary' : ''}>
          ✓ 8文字以上
        </li>
        <li className={/\d/.test(password) ? 'text-primary' : ''}>
          ✓ 数字を含む
        </li>
        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-primary' : ''}>
          ✓ 特殊文字を含む
        </li>
      </ul>
    </div>
  )
}
