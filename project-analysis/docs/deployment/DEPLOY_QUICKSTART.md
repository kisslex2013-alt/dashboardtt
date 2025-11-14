# 🚀 Быстрый старт: Деплой на Cloudflare Pages

## ⚡ За 3 шага

### 1. Настройка .env

Создайте файл `.env` в корне проекта:

```env
CF_ACCOUNT_ID=ваш_account_id
CF_API_TOKEN=ваш_api_token
CF_PROJECT_NAME=dashboardtt
```

**Где найти:**

- **Account ID**: https://dash.cloudflare.com → справа внизу
- **API Token**: https://dash.cloudflare.com/profile/api-tokens → Create Token → Cloudflare Pages → Edit

### 2. Создайте проект (первый раз)

1. Откройте https://dash.cloudflare.com → Pages
2. "Create a project" → "Upload assets directly"
3. Назовите: `dashboardtt`
4. Выберите папку `dist` → "Deploy site"

### 3. Деплой

```bash
npm run deploy
```

Готово! 🎉

---

**Подробная документация**: `docs/deployment/CLOUDFLARE_DEPLOY.md`
