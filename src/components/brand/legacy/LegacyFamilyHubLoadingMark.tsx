/**
 * Loader anterior do Family Hub, preservado para uma eventual restauração.
 * Para reativá-lo, renderize este componente em FamilyHubLoadingMark.tsx.
 */
export default function LegacyFamilyHubLoadingMark() {
  return (
    <svg className="app-loading-logo" viewBox="220 20 280 320" role="img" aria-label="Carregando Family Hub">
      <g className="fh-logo-minimal-f" fill="currentColor">
        <rect x="270" y="54" width="44" height="252" rx="10" />
        <rect x="270" y="54" width="180" height="44" rx="10" />
        <rect x="270" y="158" width="148" height="44" rx="10" />
      </g>
      <circle className="fh-logo-minimal-dot" cx="360" cy="180" r="11" fill="var(--fh-logo-accent)" />
      <g className="fh-logo-minimal-h" fill="currentColor">
        <rect x="270" y="54" width="44" height="252" rx="10" />
        <rect x="406" y="54" width="44" height="252" rx="10" />
        <rect x="270" y="158" width="180" height="44" rx="10" />
      </g>
    </svg>
  )
}
