# ЯНГ - Деплой на Cloudflare Pages

Этот проект готов к деплою на Cloudflare Pages.

## Структура файлов

- `index.html` - Главная страница с навигацией
- `tasks-page.html` - Страница заданий
- `accruals-page.html` - Страница начислений

## Инструкция по деплою

### Способ 1: Через Wrangler CLI (рекомендуется)

1. Установите Wrangler (если еще не установлен):
   ```bash
   npm install -g wrangler
   ```

2. Войдите в Cloudflare:
   ```bash
   wrangler login
   ```

3. Загрузите проект:
   ```bash
   cd primer/ЯНГ/Deploy
   wrangler pages deploy . --project-name=yang-dashboard
   ```

### Способ 2: Через веб-интерфейс Cloudflare Pages

1. Зайдите на https://dash.cloudflare.com/
2. Выберите "Workers & Pages" → "Pages"
3. Нажмите "Create a project"
4. Выберите "Upload assets"
5. Загрузите всю папку `Deploy` (можно создать ZIP архив)
6. Нажмите "Deploy site"

### Способ 3: Через Git (автоматический деплой)

1. Создайте репозиторий на GitHub
2. Загрузите файлы из папки `Deploy` в репозиторий
3. В Cloudflare Pages:
   - Нажмите "Create a project"
   - Выберите "Connect to Git"
   - Выберите ваш репозиторий
   - Укажите:
     - Build command: (оставьте пустым - статический сайт)
     - Build output directory: `/` (или не указывайте)
   - Нажмите "Save and Deploy"

## После деплоя

После успешного деплоя вы получите URL вида:
- `https://[project-name].pages.dev`

Все страницы будут доступны по:
- `https://[project-name].pages.dev/` - главная страница
- `https://[project-name].pages.dev/tasks-page.html` - страница заданий
- `https://[project-name].pages.dev/accruals-page.html` - страница начислений

## Примечания

- Все страницы используют Tailwind CSS через CDN
- Все зависимости загружаются из внешних источников
- Для работы не требуется сборка проекта
- Навигация между страницами работает через относительные пути

