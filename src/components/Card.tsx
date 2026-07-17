import { theme } from '../theme'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export default function Card({ children, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={`bg-${theme.colors.surface} border border-${theme.colors.surfaceLight} rounded-xl p-4 ${
        interactive ? 'hover:border-purple-500 transition cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
