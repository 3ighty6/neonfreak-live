interface NeonChipProps {
  size?: number
  label?: string | number
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}

const CHIP_COLORS: Record<number, string> = {
  5: '#ff4d7a',
  10: '#ff2d95',
  25: '#ff6b9d',
  50: '#ff1a4b',
  100: '#ff00aa',
}

/** A little glowing neon cherry silhouette, standing in for casino chips. */
export default function NeonChip({ size = 40, label, onClick, active, disabled }: NeonChipProps) {
  const neon = (typeof label === 'number' && CHIP_COLORS[label]) || '#ff2d95'
  const uid = `${size}-${label ?? 'x'}`
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      disabled={disabled}
      className={`relative transition disabled:opacity-40 ${onClick ? 'hover:scale-110 cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className={active ? 'drop-shadow-[0_0_10px_rgba(255,45,149,0.9)]' : ''}>
        <defs>
          <filter id={`neonGlow${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feFlood floodColor={neon} floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke={neon} strokeWidth="2.5" filter={`url(#neonGlow${uid})`} opacity="0.95" />
        <circle cx="50" cy="50" r="41" fill="rgba(0,0,0,0.55)" stroke={neon} strokeWidth="1" opacity="0.7" />
        <g transform="translate(50, 48)" filter={`url(#neonGlow${uid})`}>
          <circle cx="-13" cy="4" r="13" fill="none" stroke={neon} strokeWidth="3.2" />
          <circle cx="13" cy="4" r="13" fill="none" stroke={neon} strokeWidth="3.2" />
          <path d="M-13 -7 Q0 -22 13 -7" fill="none" stroke={neon} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M1 -18 Q10 -26 16 -16 Q8 -14 1 -18" fill="none" stroke={neon} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      {label !== undefined && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 border border-cyan-400/40 rounded-full px-1.5 text-[9px] font-bold text-cyan-200 whitespace-nowrap">
          {label}
        </span>
      )}
    </Wrapper>
  )
}
