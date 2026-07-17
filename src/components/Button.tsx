import { theme } from '../theme'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: `bg-gradient-to-r ${theme.colors.primary} text-white hover:opacity-90 active:scale-95`,
    secondary: `bg-gradient-to-r ${theme.colors.secondary} text-white hover:opacity-90 active:scale-95`,
    accent: `bg-gradient-to-r ${theme.colors.accent} text-white hover:opacity-90 active:scale-95`,
    ghost: `bg-transparent border border-${theme.colors.surfaceLight} text-${theme.colors.text} hover:bg-${theme.colors.surfaceLight}`,
    danger: `bg-${theme.colors.error} text-white hover:opacity-90 active:scale-95`,
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {loading && <div className="animate-spin">⏳</div>}
      {icon && !loading && icon}
      {children}
    </button>
  )
}
