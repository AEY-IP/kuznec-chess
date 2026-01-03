import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        // Новая цветовая схема
        primary: {
          DEFAULT: '#241BDE', // Основной темно-синий
          light: '#3B66DB',   // Синий
          lighter: '#5FA7DC', // Голубой
          50: '#f0f0fe',
          100: '#e0e1fd',
          200: '#c6c8fb',
          300: '#a4a6f7',
          400: '#8381f1',
          500: '#6d69e9',
          600: '#5c52dc',
          700: '#4d43c3',
          800: '#3e389e',
          900: '#241BDE',
        },
        accent: {
          mint: '#5EDBBE',    // Мятный/бирюзовый
          cyan: '#5ECFDB',    // Светло-бирюзовый
        },
        // Для совместимости со старым кодом
        chess: {
          gold: '#241BDE',
          'gold-light': '#5EDBBE',
          'gold-dark': '#3B66DB',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'chess-glow': 'chessGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        chessGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
      },
      backgroundImage: {
        'chess-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='30' fill='%23f0d9b5'/%3E%3Crect x='30' width='30' height='30' fill='%23b58863'/%3E%3Crect y='30' width='30' height='30' fill='%23b58863'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%23f0d9b5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
export default config
