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

  // Vercel-friendly output
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
