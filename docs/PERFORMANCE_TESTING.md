# ⚡ Performance Testing Guide

## Обзор

Проект использует автоматическое тестирование производительности с Lighthouse для обеспечения метрик >90.

## Инструменты

### 1. **Lighthouse CI**
Автоматическое тестирование производительности с порогами.

**Использование:**
```bash
npm run test:lighthouse
```

### 2. **Playwright Performance Tests**
E2E тесты для проверки производительности.

**Использование:**
```bash
npm run test:performance
```

## Метрики

### Core Web Vitals

1. **LCP (Largest Contentful Paint)** < 2.5s
   - Время загрузки самого большого контента
   - Цель: < 2.5s

2. **FID (First Input Delay)** < 100ms
   - Задержка первого взаимодействия
   - Цель: < 100ms

3. **CLS (Cumulative Layout Shift)** < 0.1
   - Накопленное смещение макета
   - Цель: < 0.1

### Дополнительные метрики

- **FCP (First Contentful Paint)** < 2s
- **TBT (Total Blocking Time)** < 300ms
- **Speed Index** < 3s
- **Time to Interactive** < 3.8s

### Пороги Lighthouse

- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

## Запуск тестов

### Локально

```bash
# 1. Запустить dev сервер
npm run dev

# 2. В другом терминале запустить preview
npm run build
npm run preview

# 3. Запустить Lighthouse тесты
npm run test:lighthouse
```

### В CI/CD

```bash
# Использовать Lighthouse CI
npm run test:lighthouse:ci
```

## Конфигурация

### lighthouserc.js

Основной файл конфигурации Lighthouse CI с порогами для всех метрик.

### e2e/performance.spec.js

E2E тесты для проверки производительности через Playwright.

## Оптимизации

### Уже реализовано:

1. **Code Splitting**
   - Lazy loading для больших компонентов
   - Разделение vendor chunks

2. **Bundle Optimization**
   - Минификация через esbuild
   - Tree-shaking для неиспользуемого кода

3. **Image Optimization**
   - SVG для иконок
   - Оптимизация изображений

4. **Caching**
   - Service Worker для кэширования
   - Долгосрочное кэширование статических ресурсов

### Рекомендации:

1. **Preload критических ресурсов**
   ```html
   <link rel="preload" href="/critical.css" as="style">
   <link rel="preload" href="/critical.js" as="script">
   ```

2. **Оптимизация шрифтов**
   ```css
   @font-face {
     font-display: swap;
   }
   ```

3. **Lazy loading изображений**
   ```html
   <img loading="lazy" src="image.jpg" alt="Description">
   ```

4. **Минификация CSS/JS**
   - Уже настроено через Vite

5. **Gzip/Brotli compression**
   - Настроить на сервере

## Мониторинг

### Регулярные проверки

- После каждого деплоя
- При добавлении новых зависимостей
- При изменении критических компонентов

### CI/CD интеграция

Lighthouse CI можно интегрировать в GitHub Actions или другой CI/CD:

```yaml
- name: Run Lighthouse CI
  run: npm run test:lighthouse:ci
```

## Полезные ссылки

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

