import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ИСПРАВЛЕНО: Добавлен base path для корректной работы на Netlify
  base: '/',
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true // Показывать ошибки в браузере
    },
    watch: {
      // Игнорируем изменения в node_modules и других служебных папках
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  // Улучшенная обработка ошибок и оптимизация бандла
  build: {
    sourcemap: true,
    minify: 'esbuild', // esbuild быстрее и работает лучше с Vite (по умолчанию)
    // Для terser нужно использовать плагин vite-plugin-terser
    // Пока используем esbuild (быстрее и достаточно эффективен)
    // ✅ ОПТИМИЗАЦИЯ: Разделение бандла на чанки для уменьшения размера
    rollupOptions: {
      output: {
        // ИСПРАВЛЕНО: Оптимизированное разделение чанков с правильным порядком загрузки
        // Все библиотеки, зависящие от React, должны быть в одном чанке с React
        manualChunks(id) {
          // React и React DOM в отдельный чанк (должен загружаться первым)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // ИСПРАВЛЕНО: framer-motion зависит от React, поэтому должен быть в том же чанке
          // Это решает проблему "Cannot read properties of undefined (reading 'createContext')"
          if (id.includes('node_modules/framer-motion')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: @iconify/react зависит от React (использует forwardRef)
          // Это решает проблему "Cannot read properties of undefined (reading 'forwardRef')"
          if (id.includes('node_modules/@iconify/react')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: @headlessui/react зависит от React (использует React hooks и context)
          if (id.includes('node_modules/@headlessui')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: Zustand зависит от React (использует use-sync-external-store)
          // Это решает проблему "Cannot set properties of undefined (setting 'Children')"
          if (id.includes('node_modules/zustand')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: use-sync-external-store также зависит от React
          if (id.includes('node_modules/use-sync-external-store')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: react-redux зависит от React (использует useLayoutEffect)
          // Это решает проблему "Cannot read properties of undefined (reading 'useLayoutEffect')"
          // react-redux является зависимостью recharts
          if (id.includes('node_modules/react-redux')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // ИСПРАВЛЕНО: @reduxjs/toolkit зависит от react-redux
          if (id.includes('node_modules/@reduxjs/toolkit')) {
            return 'react-vendor'; // Загружаем вместе с React
          }
          // Библиотеки для графиков
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          // Иконки - самая большая библиотека, разделяем отдельно
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          // Утилиты для работы с датами
          if (id.includes('node_modules/date-fns')) {
            return 'utils-vendor';
          }
          // Tone.js для звуков (большая библиотека)
          if (id.includes('node_modules/tone')) {
            return 'audio-vendor';
          }
          // Остальные node_modules в общий vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // ИСПРАВЛЕНО: Явный порядок загрузки чанков для гарантии правильной последовательности
        // React-vendor должен загружаться первым (через modulepreload)
        // Это обеспечивается автоматически через зависимости в коде
        // Оптимизация имен файлов для кеширования
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Увеличиваем лимит предупреждения о размере чанков (так как мы разделили на чанки)
    chunkSizeWarningLimit: 600,
    // Включаем оптимизацию
    cssCodeSplit: true,
    reportCompressedSize: true
  }
})
