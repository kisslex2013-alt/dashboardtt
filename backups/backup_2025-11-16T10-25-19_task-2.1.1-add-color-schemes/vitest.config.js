import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // ✅ ТЕСТЫ: Настройка окружения для тестов
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // ✅ A11Y: Настройка для accessibility тестов
    setupFilesAfterEnv: ['./src/test/a11y-setup.js'],
    // ✅ ТЕСТЫ: UI mode для визуального интерфейса
    ui: true,
    // ✅ ТЕСТЫ: Исключаем папки backups и другие служебные
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/backups/**',
      '**/del/**',
      '**/primer/**',
      '**/promo/**',
      '**/referens/**',
      '**/solution/**',
      '**/theme-toggle/**',
      '**/e2e/**',
      '**/logs/**',
      '**/json/**',
      '**/pic/**',
      '**/changelog/**',
      '**/misc/**',
      '**/.{idea,git,cursor}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    // ✅ ТЕСТЫ: Покрытие кода (цель 80%+)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/__tests__/**',
        'backups/**',
        'del/**',
      ],
      // Пороги покрытия
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
})
