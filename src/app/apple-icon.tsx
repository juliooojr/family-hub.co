import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(145deg, #10110f 0%, #20221f 58%, #3d2004 100%)',
          color: '#e8760a',
          display: 'flex',
          fontSize: 48,
          fontWeight: 900,
          height: '100%',
          justifyContent: 'center',
          letterSpacing: -4,
          width: '100%',
        }}
      >
        FH
      </div>
    ),
    size,
  )
}
