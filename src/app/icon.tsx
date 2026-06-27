import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(145deg, #10110f 0%, #20221f 58%, #3d2004 100%)',
          color: '#f1f2ec',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            border: '10px solid #e8760a',
            borderRadius: 96,
            display: 'flex',
            height: 260,
            justifyContent: 'center',
            width: 260,
          }}
        >
          <span
            style={{
              color: '#e8760a',
              fontSize: 132,
              fontWeight: 900,
              letterSpacing: -10,
            }}
          >
            FH
          </span>
        </div>
      </div>
    ),
    size,
  )
}
