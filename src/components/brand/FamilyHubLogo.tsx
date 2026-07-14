type FamilyHubLogoProps = {
  className?: string
  animated?: boolean
  houseOnly?: boolean
  animationStyle?: 'standard' | 'soft' | 'anchor' | 'bloom'
  markVariant?: 'default' | 'sharedLeg' | 'reference'
  title?: string
}

export default function FamilyHubLogo({
  className,
  animated = false,
  houseOnly = false,
  animationStyle = 'standard',
  markVariant = 'default',
  title = 'Family Hub',
}: FamilyHubLogoProps) {
  const animationClass = animated
    ? animationStyle === 'standard'
      ? houseOnly ? 'fh-logo-animate-house' : 'fh-logo-animate-full'
      : `fh-logo-animate-${animationStyle}`
    : ''
  const house = getHouseGeometry(markVariant)

  return (
    <svg
      className={[className, 'fh-logo-svg', animationClass].filter(Boolean).join(' ')}
      viewBox="0 0 720 360"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g id="F" className="fh-logo-letter fh-logo-f" fill="currentColor">
        <rect x="84" y="54" width="44" height="252" rx="10" />
        <rect x="84" y="54" width="202" height="44" rx="10" />
        <rect x="84" y="158" width="166" height="44" rx="10" />
      </g>
      <g id="H" className="fh-logo-letter fh-logo-h" fill="currentColor">
        <rect x="366" y="54" width="44" height="252" rx="10" />
        <rect x="590" y="54" width="44" height="252" rx="10" />
        <rect x="366" y="158" width="268" height="44" rx="10" />
      </g>
      <circle id="CenterDot" className="fh-logo-dot" cx={house.dotX} cy={house.dotY} r={house.dotRadius} fill="var(--fh-logo-accent)" />
      <g id="House" className={`fh-logo-house fh-logo-house-${markVariant}`} fill="none" stroke="var(--fh-logo-accent)" strokeLinecap="round" strokeLinejoin="round">
        <path id="Roof" className="fh-logo-roof" d={house.roof} pathLength="1" />
        {house.sides ? <path id="HouseSides" className="fh-logo-sides" d={house.sides} pathLength="1" /> : null}
      </g>
      <g id="Window" className="fh-logo-window" fill="var(--fh-logo-accent)">
        {house.windows.map((tile) => (
          <rect className="fh-logo-window-tile" x={tile.x} y={tile.y} width={tile.size} height={tile.size} rx={tile.radius} key={`${tile.x}-${tile.y}`} />
        ))}
      </g>
    </svg>
  )
}

function getHouseGeometry(markVariant: NonNullable<FamilyHubLogoProps['markVariant']>) {
  if (markVariant === 'sharedLeg') {
    return {
      dotX: 326,
      dotY: 194,
      dotRadius: 6,
      roof: 'M 286 306 L 286 234 L 326 194 L 366 234',
      sides: '',
      windows: getWindowTiles(326, 260, 10),
    }
  }

  if (markVariant === 'reference') {
    return {
      dotX: 326,
      dotY: 194,
      dotRadius: 5.5,
      roof: 'M 296 286 L 296 228 L 326 194 L 356 228',
      sides: 'M 356 228 L 356 286',
      windows: getWindowTiles(326, 248, 9),
    }
  }

  return {
    dotX: 326,
    dotY: 194,
    dotRadius: 6,
    roof: 'M 286 306 L 286 234 L 326 194 L 366 234',
    sides: 'M 366 234 L 366 306',
    windows: getWindowTiles(326, 260, 10),
  }
}

function getWindowTiles(centerX: number, topY: number, size: number) {
  const gap = 8
  const leftX = centerX - size - gap / 2
  const rightX = centerX + gap / 2
  const bottomY = topY + size + gap
  const radius = Math.max(2, size / 4)

  return [
    { x: leftX, y: topY, size, radius },
    { x: rightX, y: topY, size, radius },
    { x: leftX, y: bottomY, size, radius },
    { x: rightX, y: bottomY, size, radius },
  ]
}
