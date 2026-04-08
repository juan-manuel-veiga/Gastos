/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        numbers: ['"Rubik"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f7f7f5',
          100: '#eeede8',
          200: '#dddbd2',
          300: '#c5c2b4',
          400: '#a9a590',
          500: '#918d76',
          600: '#7d7962',
          700: '#676452',
          800: '#555245',
          900: '#47453b',
          950: '#262520',
        },
        surface: {
          DEFAULT: '#0f0f0d',
          1: '#171714',
          2: '#1e1e1a',
          3: '#252521',
          4: '#2e2e29',
        },
        accent: {
          lime: '#c8f54a',
          amber: '#f5c842',
          rose: '#f54a6e',
          sky: '#4ab8f5',
          violet: '#a855f7',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        countUp: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'glow-lime': '0 0 20px rgba(200, 245, 74, 0.15)',
        'glow-rose': '0 0 20px rgba(245, 74, 110, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
        'modal': '0 25px 60px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
