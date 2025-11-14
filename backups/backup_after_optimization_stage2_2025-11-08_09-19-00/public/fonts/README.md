# Inter Font Files

Шрифты Inter загружаются локально для оптимизации производительности.

## Веса шрифтов:
- **400** (normal/regular) - основной текст
- **500** (medium) - акцентный текст
- **600** (semibold) - подзаголовки
- **700** (bold) - заголовки

## Как скачать шрифты:

### Вариант 1: Прямые ссылки Google Fonts (WOFF2)

Скачайте файлы по ссылкам:

```
https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2 (400)
https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA-Ek-_EeA.woff2 (500)
https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiB-Ek-_EeA.woff2 (600)
https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiC-Ek-_EeA.woff2 (700)
```

Переименуйте файлы:
- `inter-400.woff2`
- `inter-500.woff2`
- `inter-600.woff2`
- `inter-700.woff2`

### Вариант 2: Google Fonts Helper

1. Перейдите на https://google-webfonts-helper.herokuapp.com/fonts/inter
2. Выберите веса: 400, 500, 600, 700
3. Выберите форматы: woff2, woff (для fallback)
4. Скачайте файлы
5. Переименуйте и разместите в этой папке

### Вариант 3: Google Fonts API (через браузер)

1. Откройте в браузере: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap
2. Скопируйте ссылки на `woff2` файлы из `@font-face` правил
3. Скачайте файлы через браузер
4. Переименуйте и разместите в этой папке

## Структура файлов:

```
public/fonts/
  ├── inter-400.woff2  (Regular)
  ├── inter-500.woff2  (Medium)
  ├── inter-600.woff2  (Semibold)
  └── inter-700.woff2  (Bold)
```

