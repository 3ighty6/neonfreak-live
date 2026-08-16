/**
 * Subtle floating dust/particle background -- decorative only, low
 * opacity, positions randomized once per mount so it doesn't feel
 * mechanically repetitive. Absolutely positioned within a relatively-
 * positioned parent; parent content should use `relative z-10` to
 * stay above it.
 */
export default function ParticleField({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 18}s`,
    duration: `${14 + Math.random() * 10}s`,
    key: i,
  }))

  return (
    <div className="particle-field">
      {particles.map((p) => (
        <span
          key={p.key}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}
