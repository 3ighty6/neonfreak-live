/**
 * NEONLIGHTS.CAM - COMPLETE DESIGN SYSTEM
 * Neon/Glow aesthetic with full brand identity
 * All components follow this design language
 */

import React from 'react'

// ============================================
// NEON COLORS & THEME
// ============================================

export const neonTheme = {
  colors: {
    // Primary Neon
    primary: '#FF1493', // Hot pink neon
    secondary: '#00FFFF', // Cyan neon
    accent: '#FFD700', // Gold accent
    
    // Backgrounds
    darkBg: '#0a0e27', // Very dark blue-black
    cardBg: '#1a1f3a', // Card background
    
    // Neon glows
    pinkGlow: 'rgba(255, 20, 147, 0.5)',
    cyanGlow: 'rgba(0, 255, 255, 0.5)',
    
    // Text
    white: '#ffffff',
    lightGray: '#e0e0e0',
    dimGray: '#808080',
  },
  
  shadows: {
    // Neon glow effects
    pinkNeon: '0 0 10px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5)',
    cyanNeon: '0 0 10px #00FFFF, 0 0 20px rgba(0, 255, 255, 0.5)',
    pinkCyanNeon: '0 0 10px #FF1493, 0 0 20px #00FFFF, 0 0 30px rgba(255, 20, 147, 0.3)',
    card: '0 8px 32px rgba(255, 20, 147, 0.1)',
  },
}

// ============================================
// NEON BUTTON COMPONENT
// ============================================

interface NeonButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function NeonButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: NeonButtonProps) {
  const baseStyles = `
    font-bold rounded-lg transition-all duration-200
    hover:shadow-lg active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-pink-600 to-pink-500
      text-white border-2 border-pink-400
      hover:shadow-[${neonTheme.shadows.pinkNeon}]
      hover:text-yellow-200
    `,
    secondary: `
      bg-gradient-to-r from-cyan-600 to-cyan-500
      text-white border-2 border-cyan-400
      hover:shadow-[${neonTheme.shadows.cyanNeon}]
    `,
    accent: `
      bg-gradient-to-r from-yellow-500 to-orange-500
      text-black border-2 border-yellow-300
      hover:shadow-lg
    `,
  }

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{
        textShadow: '0 0 10px rgba(255, 20, 147, 0.5)',
      }}
    >
      {children}
    </button>
  )
}

// ============================================
// NEON CARD COMPONENT
// ============================================

interface NeonCardProps {
  children: React.ReactNode
  className?: string
  glow?: 'pink' | 'cyan' | 'both'
}

export function NeonCard({ children, className = '', glow = 'pink' }: NeonCardProps) {
  const glowStyles = {
    pink: `border-pink-500 shadow-[${neonTheme.shadows.pinkNeon}]`,
    cyan: `border-cyan-500 shadow-[${neonTheme.shadows.cyanNeon}]`,
    both: `border-pink-500 shadow-[${neonTheme.shadows.pinkCyanNeon}]`,
  }

  return (
    <div
      className={`
        bg-gradient-to-br from-slate-900 to-slate-800
        border-2 rounded-xl p-6
        backdrop-blur-sm
        ${glowStyles[glow]}
        ${className}
      `}
      style={{
        boxShadow: neonTheme.shadows[`${glow}Neon` as keyof typeof neonTheme.shadows],
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// NEON TEXT COMPONENT
// ============================================

interface NeonTextProps {
  children: React.ReactNode
  glow?: 'pink' | 'cyan' | 'dual'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function NeonText({ children, glow = 'pink', className = '', size = 'md' }: NeonTextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }

  const glowStyles = {
    pink: { textShadow: '0 0 10px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5)' },
    cyan: { textShadow: '0 0 10px #00FFFF, 0 0 20px rgba(0, 255, 255, 0.5)' },
    dual: { textShadow: '0 0 10px #FF1493, 0 0 10px #00FFFF, 0 0 20px rgba(255, 20, 147, 0.3)' },
  }

  return (
    <span
      className={`${sizeClasses[size]} ${className}`}
      style={{
        color: glow === 'cyan' ? '#00FFFF' : '#FF1493',
        ...glowStyles[glow],
      }}
    >
      {children}
    </span>
  )
}

// ============================================
// TOKEN BALANCE WIDGET (PROMINENT)
// ============================================

interface TokenBalanceProps {
  balance: number
  onBuyClick: () => void
}

export function TokenBalance({ balance, onBuyClick }: TokenBalanceProps) {
  return (
    <div
      className="flex items-center gap-3 bg-gradient-to-r from-pink-900 to-cyan-900 px-4 py-2 rounded-full border-2 border-pink-500"
      style={{
        boxShadow: neonTheme.shadows.pinkCyanNeon,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '20px' }}>💎</span>
        <span className="font-bold text-white">{balance.toLocaleString()}</span>
      </div>
      <button
        onClick={onBuyClick}
        className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold transition-all"
        style={{
          textShadow: '0 0 5px rgba(255, 215, 0, 0.5)',
        }}
      >
        + Buy
      </button>
    </div>
  )
}

// ============================================
// LIVE INDICATOR
// ============================================

export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-3 h-3 rounded-full bg-red-600" style={{ boxShadow: '0 0 10px #FF0000' }} />
      <span className="font-bold text-red-500" style={{ textShadow: '0 0 10px #FF0000' }}>
        LIVE
      </span>
    </div>
  )
}

// ============================================
// AI CREATOR BADGE
// ============================================

interface AIBadgeProps {
  isAI: boolean
  className?: string
}

export function AIBadge({ isAI, className = '' }: AIBadgeProps) {
  if (!isAI) return null

  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-purple-400 ${className}`}
      style={{
        boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
      }}
    >
      <span className="text-xs font-bold text-white">🤖 AI MODEL</span>
    </div>
  )
}

// ============================================
// NEON LOGO
// ============================================

export function NeonLogo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="text-3xl font-black"
        style={{
          background: 'linear-gradient(135deg, #FF1493, #00FFFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px #FF1493, 0 0 20px #00FFFF',
          filter: 'drop-shadow(0 0 10px #FF1493) drop-shadow(0 0 10px #00FFFF)',
        }}
      >
        NEONLIGHTS
      </div>
      <span className="text-pink-500 text-sm">.cam</span>
    </div>
  )
}

export default neonTheme
