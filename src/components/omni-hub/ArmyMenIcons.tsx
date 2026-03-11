import { SVGProps } from 'react'

export interface PumpIconProps extends SVGProps<SVGSVGElement> {
  abbreviation: string
  isSafe?: boolean
  baseColor?: string
  glowColor?: string
  powderDotColor?: string
}

export function PumpIcon({
  abbreviation,
  isSafe,
  baseColor = 'currentColor',
  glowColor,
  powderDotColor,
  className = '',
  ...props
}: PumpIconProps) {
  const filterId = `glow-${Math.random().toString(36).substring(2, 9)}`

  // Entire icon absorbs the powder coat color if applicable
  const iconColor = powderDotColor || baseColor

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={`relative ${className}`}
      style={{ overflow: 'visible' }}
      {...props}
    >
      {glowColor && (
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      )}

      {/* ---------- Option C: Hard Drop Shadow ---------- */}
      {/* Shadow for SAFE Border */}
      {isSafe && (
        <rect
          x="4"
          y="30"
          width="96"
          height="48"
          rx="6"
          fill="none"
          stroke="rgba(0,0,0,0.85)"
          strokeWidth="6"
        />
      )}

      {/* Main border if SAFE */}
      {isSafe && (
        <rect
          x="2"
          y="28"
          width="96"
          height="48"
          rx="6"
          fill="none"
          stroke={iconColor}
          strokeWidth="6"
          filter={glowColor ? `url(#${filterId})` : undefined}
        />
      )}

      {/* Shadow for Text */}
      <text
        x="52"
        y="67"
        textAnchor="middle"
        fill="rgba(0,0,0,0.85)"
        fontSize="34"
        fontFamily="sans-serif"
        fontWeight="900"
        letterSpacing="1"
      >
        {abbreviation}
      </text>

      {/* Main Text */}
      <text
        x="50"
        y="65"
        textAnchor="middle"
        fill={iconColor}
        fontSize="34"
        fontFamily="sans-serif"
        fontWeight="900"
        letterSpacing="1"
        filter={glowColor ? `url(#${filterId})` : undefined}
      >
        {abbreviation}
      </text>
    </svg>
  )
}
