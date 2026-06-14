import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#111210', 2: '#1a1c19', 3: '#222420' },
        surface: { DEFAULT: '#1e201d', 2: '#252722' },
        border:  { DEFAULT: '#2e302b', 2: '#3a3d36' },
        text:    { DEFAULT: '#e8e9e4', 2: '#9a9c94', 3: '#5a5c54' },
        accent:  { DEFAULT: '#e8760a', 2: '#f59332', dim: '#3d2004' },
        danger:  { DEFAULT: '#c0392b', dim: '#2d0e0b' },
        success: { DEFAULT: '#4a9e6b', dim: '#0e2918' },
        info:    { DEFAULT: '#3a7fbf', dim: '#0a1e2d' },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
      },
    },
  },
  plugins: [],
}

export default config