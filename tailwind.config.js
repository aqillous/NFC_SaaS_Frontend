/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0F14',
          900: '#10161D',
          800: '#161D26',
          700: '#1E2733',
          600: '#2A3542',
          500: '#3D4A59',
          400: '#5B6B7C',
          300: '#8697A8',
          200: '#B9C4CE',
          100: '#DDE4E9',
          50: '#F3F6F8',
        },
        signal: {
          600: '#0E7C66',
          500: '#12987D',
          400: '#2DB596',
        },
        amber: {
          500: '#C7821A',
        },
        rust: {
          500: '#B4472C',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(11, 15, 20, 0.06), 0 1px 1px rgba(11, 15, 20, 0.04)',
        panel: '0 1px 3px rgba(11, 15, 20, 0.08), 0 8px 24px -8px rgba(11, 15, 20, 0.12)',
      },
    },
  },
  plugins: [],
}
