import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // * Плагин для обновления дефолтных значений иконок и цветов в коде
    {
      name: 'icon-defaults-updater',
      configureServer(server) {
        server.middlewares.use('/api/update-icon-defaults', (req, res, next) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                const defaultSettingsPath = join(
                  process.cwd(),
                  'src',
                  'constants',
                  'defaultIconSettings.js'
                )
                let content = readFileSync(defaultSettingsPath, 'utf8')
                let updated = false

                // Если переданы все значения сразу (saveAsDefaults)
                if (data.iconReplacements && data.buttonColorReplacements) {
                  // Обновляем все иконки
                  const iconReplacements = data.iconReplacements
                  Object.entries(iconReplacements).forEach(([iconId, iconName]) => {
                    const escapedIconId = iconId.replace(/'/g, "\\'")
                    // Паттерн ищет значение с запятой или без (всегда добавляем запятую)
                    const iconPattern = new RegExp(
                      `('${escapedIconId}'\\s*:\\s*)'[^']*'(\\s*,?)`,
                      'g'
                    )
                    if (iconPattern.test(content)) {
                      // Всегда добавляем запятую после значения (лишняя запятая в конце объекта допустима в JS)
                      content = content.replace(
                        iconPattern,
                        `$1'${iconName.replace(/'/g, "\\'")}',`
                      )
                      updated = true
                    }
                  })

                  // Обновляем все цвета
                  const buttonColorReplacements = data.buttonColorReplacements
                  Object.entries(buttonColorReplacements).forEach(([iconId, color]) => {
                    const escapedIconId = iconId.replace(/'/g, "\\'")
                    // Паттерн ищет значение с запятой или без, и комментарий (сохраняем комментарий, всегда добавляем запятую)
                    const colorPattern = new RegExp(
                      `('${escapedIconId}'\\s*:\\s*)'[^']*'(\\s*,?)([^\\n]*)`,
                      'g'
                    )
                    if (colorPattern.test(content)) {
                      const match = content.match(colorPattern)
                      if (match && match[0]) {
                        // Сохраняем комментарий, всегда добавляем запятую
                        const commentMatch = match[0].match(/(\/\/.*)$/)
                        const comment = commentMatch ? commentMatch[1] : ''
                        content = content.replace(
                          colorPattern,
                          `$1'${color.replace(/'/g, "\\'")}',${comment}`
                        )
                        updated = true
                      }
                    }
                  })

                  if (updated) {
                    console.log(
                      `✅ Обновлены все дефолтные значения: ${Object.keys(iconReplacements).length} иконок, ${Object.keys(buttonColorReplacements).length} цветов`
                    )
                  }
                }
                // Если передано одно значение (старый способ для обратной совместимости)
                else {
                  const { iconId, iconName, color } = data

                  // Обновляем иконку
                  if (iconId && iconName) {
                    const iconPattern = new RegExp(
                      `('${iconId.replace(/'/g, "\\'")}'\\s*:\\s*)'[^']*'`,
                      'g'
                    )
                    if (iconPattern.test(content)) {
                      content = content.replace(iconPattern, `$1'${iconName.replace(/'/g, "\\'")}'`)
                      updated = true
                      console.log(`✅ Обновлена иконка '${iconId}': '${iconName}'`)
                    } else {
                      // Добавляем новую иконку
                      const insertPattern =
                        /(export const DEFAULT_ICON_REPLACEMENTS = \{[\s\S]*?)(\n\};)/
                      if (insertPattern.test(content)) {
                        content = content.replace(insertPattern, (match, before, after) => {
                          return before + `  '${iconId}': '${iconName}',\n` + after
                        })
                        updated = true
                        console.log(`✅ Добавлена иконка '${iconId}': '${iconName}'`)
                      }
                    }
                  }

                  // Обновляем цвет
                  if (iconId && color) {
                    // Паттерн для поиска строки с цветом (с учетом комментариев)
                    // Ищем: 'iconId': 'старое_значение', // комментарий (опционально)
                    const escapedIconId = iconId.replace(/'/g, "\\'")
                    const colorPattern = new RegExp(
                      `('${escapedIconId}'\\s*:\\s*)'[^']*'([^\\n]*)`,
                      'g'
                    )

                    if (colorPattern.test(content)) {
                      // Сохраняем комментарий, если он есть
                      const match = content.match(colorPattern)
                      if (match && match[0]) {
                        const commentMatch = match[0].match(/(\/\/.*)$/)
                        const comment = commentMatch ? commentMatch[1] : ''
                        // Заменяем значение, сохраняя комментарий
                        content = content.replace(
                          colorPattern,
                          `$1'${color.replace(/'/g, "\\'")}'${comment}`
                        )
                        updated = true
                        console.log(`✅ Обновлен цвет '${iconId}': '${color}'`)
                      }
                    } else {
                      // Добавляем новый цвет
                      const insertPattern =
                        /(export const DEFAULT_BUTTON_COLOR_REPLACEMENTS = \{[\s\S]*?)(\n\};)/
                      if (insertPattern.test(content)) {
                        content = content.replace(insertPattern, (match, before, after) => {
                          return before + `  '${iconId}': '${color}',\n` + after
                        })
                        updated = true
                        console.log(`✅ Добавлен цвет '${iconId}': '${color}'`)
                      }
                    }
                  }
                }

                if (updated) {
                  writeFileSync(defaultSettingsPath, content, 'utf8')
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: 'Дефолтные значения обновлены в коде',
                    })
                  )
                } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(
                    JSON.stringify({ success: false, message: 'Не удалось обновить значения' })
                  )
                }
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: error.message }))
              }
            })
          } else {
            next()
          }
        })
      },
    },
    // * Плагин для обновления дефолтных значений ширины столбцов в коде
    {
      name: 'column-widths-updater',
      configureServer(server) {
        server.middlewares.use('/api/update-column-widths', (req, res, next) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const { gridWidths, tableWidths } = JSON.parse(body)
                const columnWidthsPath = join(process.cwd(), 'src', 'constants', 'columnWidths.js')
                let content = readFileSync(columnWidthsPath, 'utf8')
                let updated = false

                // Обновляем DEFAULT_GRID_COLUMN_WIDTHS
                if (gridWidths) {
                  // Паттерн для поиска объекта с комментариями
                  const gridPattern =
                    /(export const DEFAULT_GRID_COLUMN_WIDTHS = )\{([\s\S]*?)(\n\};)/
                  if (gridPattern.test(content)) {
                    // Форматируем объект с правильными отступами и комментариями
                    const comments = {
                      percentMargin: '    // Расстояние от даты до процентов',
                      insightsMargin: '  // Расстояние до инсайтов',
                      totalMargin: '       // Расстояние до итого',
                    }
                    const gridString = Object.entries(gridWidths)
                      .map(([key, value], index, array) => {
                        const comment = comments[key] || ''
                        const comma = index < array.length - 1 ? ',' : ''
                        return `  ${key}: ${value}${comma}${comment}`
                      })
                      .join('\n')
                    content = content.replace(gridPattern, `$1{\n${gridString}\n};`)
                    updated = true
                    console.log(`✅ Обновлены дефолтные grid ширины столбцов:`, gridWidths)
                  }
                }

                // Обновляем DEFAULT_TABLE_COLUMN_WIDTHS
                if (tableWidths) {
                  // Паттерн для поиска объекта с комментариями
                  const tablePattern =
                    /(export const DEFAULT_TABLE_COLUMN_WIDTHS = )\{([\s\S]*?)(\n\};)/
                  if (tablePattern.test(content)) {
                    // Форматируем объект с правильными отступами и комментариями
                    const comments = {
                      checkbox: '        // Фиксированная ширина чекбокса',
                      time: '           // Время работы (13:36—16:30)',
                      category: '       // Название категории',
                      hours: '           // Часы (2.90ч)',
                      income: '          // Доход (1000₽)',
                    }
                    const tableString = Object.entries(tableWidths)
                      .map(([key, value], index, array) => {
                        const comment = comments[key] || ''
                        const comma = index < array.length - 1 ? ',' : ''
                        return `  ${key}: ${value}${comma}${comment}`
                      })
                      .join('\n')
                    content = content.replace(tablePattern, `$1{\n${tableString}\n};`)
                    updated = true
                    console.log(`✅ Обновлены дефолтные table ширины столбцов:`, tableWidths)
                  }
                }

                if (updated) {
                  writeFileSync(columnWidthsPath, content, 'utf8')
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: 'Дефолтные значения ширины столбцов обновлены в коде',
                    })
                  )
                } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(
                    JSON.stringify({ success: false, message: 'Не удалось обновить значения' })
                  )
                }
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: error.message }))
              }
            })
          } else {
            next()
          }
        })
      },
    },
  ],
  // ИСПРАВЛЕНО: Добавлен base path для корректной работы на Netlify
  base: '/',
  // ✅ Добавлены алиасы для удобного импорта
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@store': resolve(__dirname, './src/store'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@constants': resolve(__dirname, './src/constants'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Слушать на всех интерфейсах (IPv4 и IPv6)
    hmr: {
      overlay: true, // Показывать ошибки в браузере
    },
    watch: {
      // Игнорируем изменения в node_modules и других служебных папках
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
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
        // * Все React-зависимости в одном чанке для предотвращения ошибок "forwardRef is undefined"
        manualChunks(id) {
          // React и React DOM - основа
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }

          // * Recharts и его зависимости (react-redux, @reduxjs/toolkit) - должны быть с React
          // Recharts использует React.forwardRef, поэтому должен загружаться после React
          if (id.includes('node_modules/recharts')) {
            return 'react-vendor'
          }

          // react-redux - зависимость recharts, использует useLayoutEffect из React
          if (id.includes('node_modules/react-redux')) {
            return 'react-vendor'
          }

          // @reduxjs/toolkit - зависимость react-redux
          if (id.includes('node_modules/@reduxjs/toolkit')) {
            return 'react-vendor'
          }

          // Framer Motion - использует React.createContext
          if (id.includes('node_modules/framer-motion')) {
            return 'react-vendor'
          }

          // @iconify/react - использует React.forwardRef
          if (id.includes('node_modules/@iconify/react')) {
            return 'react-vendor'
          }

          // @headlessui/react - использует React hooks и context
          if (id.includes('node_modules/@headlessui')) {
            return 'react-vendor'
          }

          // Zustand - использует use-sync-external-store из React
          if (id.includes('node_modules/zustand')) {
            return 'react-vendor'
          }

          // use-sync-external-store - зависимость zustand
          if (id.includes('node_modules/use-sync-external-store')) {
            return 'react-vendor'
          }

          // React Spring - использует React hooks
          if (id.includes('node_modules/@react-spring')) {
            return 'react-vendor'
          }

          // Lucide React (иконки) - не зависит от React напрямую, можно отдельно
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }

          // Tone.js (звуки) - не зависит от React
          if (id.includes('node_modules/tone')) {
            return 'tone-vendor'
          }

          // date-fns (работа с датами) - не зависит от React
          if (id.includes('node_modules/date-fns')) {
            return 'date-vendor'
          }
        },
      },
    },
  },
})
