import FamilyHubLogo from './FamilyHubLogo'

export default function FamilyHubLoadingMark() {
  return (
    <div className="app-loading-mark" role="status" aria-label="Carregando Family Hub">
      <FamilyHubLogo
        animated
        animationStyle="minimal-fluid"
        className="app-loading-logo"
        title="Carregando Family Hub"
      />
    </div>
  )
}
