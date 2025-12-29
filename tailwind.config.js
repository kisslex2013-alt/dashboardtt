/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Semantic Colors aligned with CSS Variables in index.css
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        
        // Backgrounds
        main: 'var(--bg-main)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        glass: {
          DEFAULT: 'var(--bg-glass)',
          light: 'rgba(255, 255, 255, 0.8)', // Legacy support
          dark: 'rgba(31, 41, 55, 0.8)',     // Legacy support
        },
        overlay: 'var(--bg-overlay)',

        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        'text-link': 'var(--text-link)',

        // Borders
        'border-light': 'var(--border-light)',
        'border-medium': 'var(--border-medium)',
        'border-focus': 'var(--border-focus)',

        // Aliases for backward compatibility
        'app-bg': 'var(--bg-main)',
        'app-text': 'var(--text-primary)',
      },
      spacing: {
        0: 'var(--space-0)',
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glass: 'var(--shadow-glass)',
      },
      animation: {
        // Появление элементов
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-standard)',
        'fade-in-fast': 'fadeIn var(--duration-fast) var(--ease-standard)',
        'fade-in-slow': 'fadeIn var(--duration-slow) var(--ease-standard)',
        'fade-out': 'fadeOut var(--duration-normal) var(--ease-standard)',
        'fade-out-fast': 'fadeOut var(--duration-fast) var(--ease-standard)',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-standard)',
        'slide-up-fast': 'slideUp var(--duration-fast) var(--ease-standard)',
        'slide-up-slow': 'slideUp var(--duration-slow) var(--ease-standard)',
        'slide-down': 'slideDown var(--duration-normal) var(--ease-standard)',
        'slide-down-fast': 'slideDown var(--duration-fast) var(--ease-standard)',
        'slide-down-slow': 'slideDown var(--duration-slow) var(--ease-standard)',
        'slide-in-right': 'slideInRight var(--duration-normal) var(--ease-standard)',
        'slide-in-right-fast': 'slideInRight var(--duration-fast) var(--ease-standard)',
        'slide-in-right-slow': 'slideInRight var(--duration-slow) var(--ease-standard)',
        'slide-out-right': 'slideOutRight var(--duration-normal) var(--ease-standard)',
        'slide-out-right-fast': 'slideOutRight var(--duration-fast) var(--ease-standard)',
        'scale-in': 'scaleIn var(--duration-normal) var(--ease-standard)',
        'scale-in-fast': 'scaleIn var(--duration-fast) var(--ease-standard)',
        'scale-in-slow': 'scaleIn var(--duration-slow) var(--ease-standard)',
        'scale-out': 'scaleOut var(--duration-normal) var(--ease-standard)',
        'scale-out-fast': 'scaleOut var(--duration-fast) var(--ease-standard)',
        // Специальные анимации
        shake: 'shake var(--duration-normal) var(--ease-standard)',
        'pulse-success': 'pulseSuccess 400ms var(--ease-standard)',
        'pulse-glow': 'pulseGlow 2s infinite var(--ease-standard)',
        shimmer: 'shimmer 2s infinite',
        // Micro-animations с bounce/spring эффектами
        'bounce-in': 'bounceIn var(--duration-normal) var(--ease-spring)',
        'bounce-in-fast': 'bounceIn var(--duration-fast) var(--ease-spring)',
        'pop': 'pop 200ms var(--ease-bounce)',
        'pop-in': 'popIn var(--duration-normal) var(--ease-spring)',
        'wiggle': 'wiggle 200ms var(--ease-elastic)',
        'press': 'press 100ms var(--ease-standard)',
        // Устаревшие (для обратной совместимости)
        'slide-in': 'slideInRight var(--duration-normal) var(--ease-standard)',
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
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Устаревшие (для обратной совместимости)
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Micro-animation keyframes
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        spring: 'var(--ease-spring)',
        bounce: 'var(--ease-bounce)',
        elastic: 'var(--ease-elastic)',
        smooth: 'var(--ease-smooth)',
      },
    },
  },
  plugins: [
    // ✅ A11Y: Плагин для accessibility классов
    function ({ addUtilities }) {
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.focus\\:not-sr-only:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
      })
    },
  ],
}
