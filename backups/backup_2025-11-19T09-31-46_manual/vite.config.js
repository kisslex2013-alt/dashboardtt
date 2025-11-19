import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Единственный корректный base для Vercel
  base: '/',

  // ✅ Настройки dev сервера
  server: {
    port: 5173,
    host: true, // Слушать на всех интерфейсах (localhost и сетевой IP)
    strictPort: false, // Если порт занят, попробовать следующий
    hmr: {
      overlay: true, // Показывать ошибки в браузере
    },
    watch: {
      // Игнорируем изменения в node_modules и других служебных папках
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },

  // ✅ ИСПРАВЛЕНИЕ: Резолв TypeScript файлов
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },

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

    // ✅ PERFORMANCE: Preload критических ресурсов обрабатывается через modulePreload в build.modulePreload
    // Vite автоматически добавляет <link rel="modulepreload"> для критических модулей

    // --- PWA plugin с явными стратегиями кэширования ---
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
      // ✅ ОПТИМИЗАЦИЯ: Явные стратегии кэширования для Service Worker
      workbox: {
        // Стратегия кэширования для статических ресурсов
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        // Runtime caching стратегии
        runtimeCaching: [
          // Cache First для статики (изображения, шрифты, иконки)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 дней
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache First для CSS и JS файлов
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 дней
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Network First для HTML (чтобы всегда получать свежие версии)
          {
            urlPattern: /\.(?:html)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 1 день
              },
              networkTimeoutSeconds: 3, // Fallback на кэш если сеть медленная
            },
          },
          // Network First для будущих API вызовов
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 минут
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache First для внешних ресурсов (шрифты Google и т.д.)
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 год
              },
            },
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
    
    // ✅ PERFORMANCE: Включаем modulePreload для правильного порядка загрузки
    modulePreload: {
      polyfill: true,
      // ✅ PERFORMANCE: Предзагрузка критических модулей в правильном порядке
      resolveDependencies: (filename, deps) => {
        // Сортируем зависимости: сначала критичные (index.js, vendor), потом остальные
        const critical = deps.filter(dep => 
          dep.includes('index') || 
          dep.includes('main') || 
          (dep.includes('vendor') && !dep.includes('AnalyticsSection') && !dep.includes('EntriesList'))
        )
        const others = deps.filter(dep => 
          !dep.includes('index') && 
          !dep.includes('main') && 
          !(dep.includes('vendor') && !dep.includes('AnalyticsSection') && !dep.includes('EntriesList'))
        )
        return [...critical, ...others]
      },
    },
    
    // ✅ ОПТИМИЗАЦИЯ: Разделение кода на чанки
    rollupOptions: {
      output: {
        // ✅ ИСПРАВЛЕНО: Ручное разделение на чанки
        // КРИТИЧНО: React и все его зависимости должны быть в основном bundle (index.js)
        // Это гарантирует правильный порядок инициализации
        manualChunks: (id) => {
          // ✅ ROUTE-BASED SPLITTING: Разделяем route-based chunks для основных секций
          // Statistics route chunk
          if (id.includes('components/statistics/StatisticsOverview')) {
            return 'route-statistics'
          }
          // Analytics route chunk
          if (id.includes('components/statistics/AnalyticsSection')) {
            return 'route-analytics'
          }
          // Entries route chunk
          if (id.includes('components/entries/EntriesList')) {
            return 'route-entries'
          }
          // Pomodoro route chunk
          if (id.includes('components/pomodoro/PomodoroPanel')) {
            return 'route-pomodoro'
          }
          
          // ✅ КРИТИЧНО: React, React-DOM и scheduler НЕ разделяем
          // Оставляем их в основном bundle (index.js) для гарантии правильного порядка загрузки
          if (
            id.includes('node_modules/react') || 
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return undefined // Остается в основном bundle
          }
          
          // ✅ КРИТИЧНО: Все React-зависимости также в основном bundle
          // framer-motion зависит от React (использует React.createContext, React.Children)
          if (id.includes('node_modules/framer-motion')) {
            return undefined // Остается в основном bundle
          }
          
          // @headlessui/react зависит от React (использует React hooks, context)
          if (id.includes('node_modules/@headlessui')) {
            return undefined // Остается в основном bundle
          }
          
          // @iconify/react зависит от React (использует React.forwardRef)
          if (id.includes('node_modules/@iconify/react')) {
            return undefined // Остается в основном bundle
          }
          
          // react-window зависит от React
          if (id.includes('node_modules/react-window')) {
            return undefined // Остается в основном bundle
          }
          
          // @vercel пакеты зависят от React
          if (id.includes('node_modules/@vercel')) {
            return undefined // Остается в основном bundle
          }
          
          // Zustand использует use-sync-external-store из React
          if (id.includes('node_modules/zustand')) {
            return undefined // Остается в основном bundle
          }
          
          // use-sync-external-store - зависимость Zustand, использует React
          if (id.includes('node_modules/use-sync-external-store')) {
            return undefined // Остается в основном bundle
          }
          
          // react-redux может быть зависимостью recharts
          if (id.includes('node_modules/react-redux')) {
            return undefined // Остается в основном bundle
          }
          
          // @reduxjs/toolkit - зависимость react-redux
          if (id.includes('node_modules/@reduxjs/toolkit')) {
            return undefined // Остается в основном bundle
          }
          
          // Recharts использует React.forwardRef и другие React API
          if (id.includes('node_modules/recharts')) {
            return undefined // Остается в основном bundle
          }
          
          // Tone.js (звуки) в отдельный чанк (не зависит от React)
          if (id.includes('node_modules/tone')) {
            return 'tone-vendor'
          }
          
          // date-fns в отдельный чанк (не зависит от React)
          if (id.includes('node_modules/date-fns')) {
            return 'date-fns-vendor'
          }
          
          // lucide-react иконки в отдельный чанк (не зависит от React напрямую)
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons-vendor'
          }
          
          // Остальные node_modules в общий vendor чанк
          // ✅ ВАЖНО: Проверяем, что это не React-зависимость
          if (id.includes('node_modules')) {
            // Если пакет содержит 'react' в названии, оставляем в основном bundle
            if (id.includes('/react') || id.includes('\\react')) {
              return undefined // Остается в основном bundle
            }
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
      'react/jsx-runtime',
      'react-dom/client',
      'zustand',
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@headlessui/react',
      // ✅ PERFORMANCE: Аналитика загружается асинхронно, не включаем в pre-bundling
      // '@vercel/analytics',
      // '@vercel/speed-insights',
    ],
    exclude: [
      'tone', // Tone.js загружается динамически, не предварительно
      '@vercel/analytics', // ✅ PERFORMANCE: Аналитика загружается асинхронно
      '@vercel/speed-insights', // ✅ PERFORMANCE: Speed Insights загружается асинхронно
    ],
    // ✅ ИСПРАВЛЕНО: Принудительно включаем React в pre-bundling
    force: true,
    // ✅ ИСПРАВЛЕНО: Убеждаемся, что React загружается первым
    esbuildOptions: {
      target: 'es2020',
    },
  },
  
})
