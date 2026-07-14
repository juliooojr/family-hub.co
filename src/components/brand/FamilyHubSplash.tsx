import FamilyHubLogo from './FamilyHubLogo'

type FamilyHubSplashProps = {
  variant?: 'full' | 'house'
  replayKey?: number
}

export default function FamilyHubSplash({ variant = 'full', replayKey = 0 }: FamilyHubSplashProps) {
  const animationStyle = variant === 'house' ? 'standard' : 'bloom'

  return (
    <div className={`fh-splash-preview ${variant === 'house' ? 'house-mode' : ''}`} key={`${variant}-${replayKey}`}>
      <FamilyHubLogo
        animated
        houseOnly={variant === 'house'}
        animationStyle={animationStyle}
        markVariant={variant === 'house' ? 'default' : 'reference'}
        className="fh-splash-logo"
        title={variant === 'house' ? 'Family Hub - casa' : 'Family Hub - logo completa'}
      />
    </div>
  )
}
