/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.8)',
          dark: 'rgba(31, 41, 55, 0.8)',
        },
      },
      animation: {
        // Появление элементов
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-in-fast': 'fadeIn 150ms ease-out',
        'fade-in-slow': 'fadeIn 500ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'fade-out-fast': 'fadeOut 150ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-up-fast': 'slideUp 150ms ease-out',
        'slide-up-slow': 'slideUp 500ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-down-fast': 'slideDown 150ms ease-out',
        'slide-down-slow': 'slideDown 500ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'slide-in-right-fast': 'slideInRight 150ms ease-out',
        'slide-in-right-slow': 'slideInRight 500ms ease-out',
        'slide-out-right': 'slideOutRight 200ms ease-in',
        'slide-out-right-fast': 'slideOutRight 150ms ease-in',
        'scale-in': 'scaleIn 300ms ease-out',
        'scale-in-fast': 'scaleIn 150ms ease-out',
        'scale-in-slow': 'scaleIn 500ms ease-out',
        'scale-out': 'scaleOut 200ms ease-in',
        'scale-out-fast': 'scaleOut 150ms ease-in',
        // Специальные анимации
        'shake': 'shake 300ms ease-in-out',
        'pulse-success': 'pulseSuccess 400ms ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        // Устаревшие (для обратной совместимости)
        'slide-in': 'slideInRight 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        pulseSuccess: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        // Устаревшие (для обратной совместимости)
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
