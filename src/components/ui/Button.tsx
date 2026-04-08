import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  fullWidth,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-accent-lime text-surface hover:bg-accent-lime/90 active:scale-[0.98] font-semibold',
    secondary: 'bg-surface-3 text-ink-100 hover:bg-surface-4 border border-white/10',
    ghost: 'text-ink-400 hover:text-ink-100 hover:bg-surface-3',
    danger: 'bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 border border-accent-rose/20',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
