interface NeonChipProps {
  size?: number
  label?: string | number
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}

/** A little glowing neon cherry, standing in for casino chips. */
export default function NeonChip({ size = 40, label, onClick, active, disabled }: NeonChipProps) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-full flex items-center justify-center transition disabled:opacity-40 ${
        onClick ? 'hover:scale-110 cursor-pointer' : ''
      } ${active ? 'ring-2 ring-pink-400' : ''}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #ff6fb8, #ff2d95 55%, #7a0e42 100%)',
        boxShadow: active
          ? '0 0 14px 2px rgba(255,45,149,0.7), 0 0 4px rgba(0,240,255,0.6) inset'
          : '0 0 8px -1px rgba(255,45,149,0.6)',
        border: '1px solid rgba(0,240,255,0.5)',
      }}
    >
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>🍒</span>
      {label !== undefined && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 border border-cyan-400/40 rounded-full px-1.5 text-[9px] font-bold text-cyan-200 whitespace-nowrap"
        >
          {label}
        </span>
      )}
    </Wrapper>
  )
}
