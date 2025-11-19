import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Единственный корректный base для Vercel
  base: '/',

  plugins: [
    react(),

    // --- Твой middleware для POST /api/update-icon-defaults ---
    {
      name: 'icon-defaults-updater',
      configureServer(server) {
        server.middlewares.use('/api/update-icon-defaults', (req, res) => {
          if (req.method !== 'POST') return

          let body = ''
          req.on('data', chunk => (body += chunk.toString()))
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = join(process.cwd(), 'public', 'icons-defaults.json')
              writeFileSync(filePath, JSON.stringify(data, null, 2))
              res.statusCode = 200
              res.end('OK')
            } catch (err) {
              res.statusCode = 500
              res.end('Error')
            }
          })
        })
      },
    },

    // --- PWA plugin (твои настройки) ---
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Time Tracker Dashboard',
        short_name: 'TimeTracker',
        theme_color: '#000000',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  // ✅ ОПТИМИЗАЦИЯ: Настройки сборки для оптимизации бандла
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    
    // ✅ ОПТИМИЗАЦИЯ: Минификация и оптимизация
    minify: 'esbuild', // Используем esbuild для быстрой минификации
    
    // ✅ ОПТИМИЗАЦИЯ: Разделение кода на чанки
    rollupOptions: {
      output: {
        // ✅ ОПТИМИЗАЦИЯ: Ручное разделение на чанки для лучшего кэширования
        manualChunks: (id) => {
          // React и React DOM в отдельный чанк
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          
          // Zustand в отдельный чанк
          if (id.includes('node_modules/zustand')) {
            return 'zustand-vendor'
          }
          
          // Recharts (графики) в отдельный чанк
          if (id.includes('node_modules/recharts')) {
            return 'recharts-vendor'
          }
          
          // Framer Motion в отдельный чанк
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion-vendor'
          }
          
          // Tone.js (звуки) в отдельный чанк
          if (id.includes('node_modules/tone')) {
            return 'tone-vendor'
          }
          
          // date-fns в отдельный чанк
          if (id.includes('node_modules/date-fns')) {
            return 'date-fns-vendor'
          }
          
          // lucide-react иконки в отдельный чанк
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons-vendor'
          }
          
          // @iconify/react в отдельный чанк
          if (id.includes('node_modules/@iconify')) {
            return 'iconify-vendor'
          }
          
          // @headlessui/react в отдельный чанк
          if (id.includes('node_modules/@headlessui')) {
            return 'headlessui-vendor'
          }
          
          // react-window в отдельный чанк
          if (id.includes('node_modules/react-window')) {
            return 'react-window-vendor'
          }
          
          // Остальные node_modules в общий vendor чанк
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        
        // ✅ ОПТИМИЗАЦИЯ: Имена файлов для лучшего кэширования
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // ✅ ОПТИМИЗАЦИЯ: Увеличиваем лимит предупреждений для больших бандлов
    chunkSizeWarningLimit: 1000,
  },
  
  // ✅ ОПТИМИЗАЦИЯ: Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@headlessui/react',
    ],
    exclude: ['tone'], // Tone.js загружается динамически, не предварительно
  },
})
