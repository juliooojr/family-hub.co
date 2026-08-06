import HouseLoadingMark from './HouseLoadingMark'

export default function FamilyHubLoadingMark() {
  return (
    <div className="app-loading-mark" role="status" aria-label="Carregando Family Hub">
      <HouseLoadingMark />
    </div>
  )
}
