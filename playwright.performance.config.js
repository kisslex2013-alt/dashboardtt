import { defineConfig, devices } from '@playwright/test'

/**
 * ✅ PERFORMANCE E2E ТЕСТЫ: Конфигурация Playwright для performance тестов
 * 
 * Использует preview server (http://localhost:4173) вместо dev server
 * Требует предварительного запуска: npm run build && npm run preview
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время выполнения одного теста */
  timeout: 60 * 1000, // Увеличено для performance тестов
  
  expect: {
    /* Максимальное время для expect assertions */
    timeout: 10000, // Увеличено для performance тестов
  },
  
  /* Запускать тесты в файлах параллельно */
  fullyParallel: false, // Performance тесты лучше запускать последовательно
  
  /* Не запускать тесты в CI/CD, если не указано явно */
  forbidOnly: !!process.env.CI,
  
  /* Повторять тесты только в CI/CD при падении */
  retries: process.env.CI ? 2 : 0,
  
  /* Количество воркеров для параллельного запуска */
  workers: 1, // Performance тесты лучше запускать по одному
  
  /* Репортер для использования */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  /* Общие настройки для всех проектов */
  use: {
    /* ✅ PERFORMANCE: Базовый URL для preview server */
    baseURL: 'http://localhost:4173',
    
    /* Собирать trace при повторных попытках при падении теста */
    trace: 'on-first-retry',
    
    /* Скриншоты при падении */
    screenshot: 'only-on-failure',
    
    /* Видео при падении */
    video: 'retain-on-failure',
  },

  /* Настройка проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* ✅ PERFORMANCE: Используем preview server вместо dev server */
  /* ВАЖНО: Перед запуском тестов нужно выполнить: npm run build && npm run preview */
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI, // Переиспользуем существующий preview server
    timeout: 120 * 1000,
  },
})

