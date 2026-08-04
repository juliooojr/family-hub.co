import FamilyHubLogo from './FamilyHubLogo'

type FamilyHubSplashProps = {
  variant?: 'full' | 'house' | 'minimal' | 'minimal-house' | 'minimal-fluid'
  replayKey?: number
}

export default function FamilyHubSplash({ variant = 'full', replayKey = 0 }: FamilyHubSplashProps) {
  const animationStyle = variant === 'house'
    ? 'standard'
    : variant === 'minimal' || variant === 'minimal-house' || variant === 'minimal-fluid'
      ? variant
      : 'bloom'

  return (
    <div className={`fh-splash-preview ${variant === 'house' ? 'house-mode' : ''}`} key={`${variant}-${replayKey}`}>
      <FamilyHubLogo
        animated
        houseOnly={variant === 'house'}
        animationStyle={animationStyle}
        markVariant={variant === 'house' ? 'default' : 'reference'}
        className="fh-splash-logo"
        title={variant === 'house'
          ? 'Family Hub - casa'
          : variant === 'minimal'
            ? 'Family Hub - F ponto H'
            : variant === 'minimal-house'
              ? 'Family Hub - F casa H'
              : variant === 'minimal-fluid'
                ? 'Family Hub - F ponto H fluido'
              : 'Family Hub - logo completa'}
      />
    </div>
  )
}
