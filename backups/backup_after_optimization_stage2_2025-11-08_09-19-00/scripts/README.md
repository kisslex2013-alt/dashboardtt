# Скрипты проекта

Эта папка содержит вспомогательные скрипты для разработки и развертывания.

## Скрипты

- `install-beads.ps1` - автоматическая установка Beads (требует Go)
- `start-dev.ps1` - запуск dev сервера через Vite
- `start-pm2-hidden.ps1` - запуск dev сервера через PM2 в скрытом окне

## Использование

Все скрипты предназначены для Windows PowerShell и должны запускаться из корня проекта.

### Пример запуска:
```powershell
cd "H:\Backup\Zero-Coding\Cursor AI\TTM_module\time-tracker"
.\scripts\start-dev.ps1
```

