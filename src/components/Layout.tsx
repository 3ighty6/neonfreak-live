import { theme } from '../theme'

interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className = '' }: LayoutProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

export function Sidebar({ children }: LayoutProps) {
  return (
    <aside className={`fixed left-0 top-0 w-64 h-screen bg-${theme.colors.background} border-r border-${theme.colors.surfaceLight} p-4 overflow-y-auto hidden md:block`}>
      {children}
    </aside>
  )
}

export function MainLayout({ children }: LayoutProps) {
  return (
    <div className={`bg-${theme.colors.background} text-${theme.colors.text} min-h-screen`}>
      {children}
    </div>
  )
}
