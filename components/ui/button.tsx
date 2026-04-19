import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.005em] transition-[background,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // ほぼ黒 (light) / ほぼ白 (dark) の solid CTA
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-foreground/10 hover:-translate-y-px hover:shadow-md hover:shadow-foreground/15 hover:bg-foreground',
        destructive:
          'bg-destructive text-white shadow-sm shadow-destructive/20 hover:-translate-y-px hover:shadow-md hover:shadow-destructive/30 hover:bg-destructive/90 focus-visible:ring-destructive/30',
        // シャープな枠 + 反転ホバー（stylish）
        outline:
          'border border-foreground/20 bg-transparent text-foreground hover:bg-foreground hover:text-background hover:border-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted hover:border-foreground/30',
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
        link:
          'text-foreground underline-offset-4 hover:underline decoration-foreground/60',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
