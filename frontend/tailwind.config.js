/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1120',
          900: '#0F172A',
          800: '#151E33',
          700: '#1E293B',
        },
        indigo: {
          50: '#EEF0FF',
          100: '#E0E4FF',
          400: '#7C82F0',
          500: '#5B5FEF',
          600: '#4A3FE5',
          700: '#3D31C9',
        },
        cyan: {
          400: '#38DDE0',
          500: '#17C7CB',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
        },
        amber: {
          400: '#F5B95B',
        },
        coral: {
          400: '#FF7A6B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 16px -4px rgba(15, 23, 42, 0.08)',
        glow: '0 0 0 1px rgba(91, 95, 239, 0.15), 0 8px 30px -8px rgba(91, 95, 239, 0.35)',
      },
      backgroundImage: {
        'pilot-gradient': 'linear-gradient(135deg, #4A3FE5 0%, #5B5FEF 45%, #17C7CB 100%)',
      },
    },
  },
  plugins: [],
}
