import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        // Оптимизированное разделение чанков
        manualChunks(id) {
          // React и React DOM в отдельный чанк (редко меняется)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Библиотеки для графиков
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          // Иконки - самая большая библиотека, разделяем отдельно
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          // UI библиотеки
          if (id.includes('node_modules/@headlessui')) {
            return 'ui-vendor';
          }
          // Утилиты для работы с датами
          if (id.includes('node_modules/date-fns')) {
            return 'utils-vendor';
          }
          // Zustand для state management
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
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
