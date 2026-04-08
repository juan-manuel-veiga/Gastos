import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', glass, hover, onClick }: CardProps) {
  const base = `
    rounded-2xl border border-white/5 
    bg-surface-2 
    shadow-card
    ${glass ? 'backdrop-blur-sm bg-white/5' : ''}
    ${hover ? 'transition-all duration-200 hover:shadow-card-hover hover:border-white/10 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `
  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  )
}
