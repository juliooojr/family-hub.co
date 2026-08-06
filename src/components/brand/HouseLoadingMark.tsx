export default function HouseLoadingMark() {
  return (
    <svg
      className="app-house-loader"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <g className="app-house-loader-scale">
        <circle className="app-house-loader-circle" cx="50" cy="50" r="40" />
        <path
          className="app-house-loader-home"
          d="M75 52.822l-8.711-6.925v-10.87a1.42 1.42 0 0 0-1.421-1.421h-4.366a1.42 1.42 0 0 0-1.421 1.421v5.138L50 32.946 25 52.822l3.192 4.015 3.642-2.895V64.65a2.404 2.404 0 0 0 2.404 2.404h31.524a2.404 2.404 0 0 0 2.404-2.404V53.941l3.642 2.895L75 52.822z"
        />
      </g>
    </svg>
  )
}
