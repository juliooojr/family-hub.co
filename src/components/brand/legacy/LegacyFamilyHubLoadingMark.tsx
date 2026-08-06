import FamilyHubLogo from '../FamilyHubLogo'

/**
 * Loader anterior do Family Hub, preservado para uma eventual restauração.
 * Para reativá-lo, renderize este componente em FamilyHubLoadingMark.tsx.
 */
export default function LegacyFamilyHubLoadingMark() {
  return (
    <FamilyHubLogo
      animated
      animationStyle="minimal-fluid"
      className="app-loading-logo"
      title="Carregando Family Hub"
    />
  )
}
