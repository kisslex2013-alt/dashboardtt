# Восстановление оригинальных анимаций

Если что-то пошло не так после унификации анимаций, вы можете восстановить оригинальные файлы из бекапа.

## Быстрое восстановление (все файлы)

```bash
# Найдите последний бекап
cd backup
LATEST_BACKUP=$(ls -t animations-backup-* | head -1)

# Восстановите основные файлы
cp "$LATEST_BACKUP/custom.css.backup" ../src/custom.css
cp "$LATEST_BACKUP/index.css.backup" ../src/index.css
cp "$LATEST_BACKUP/tailwind.config.js.backup" ../tailwind.config.js

# Удалите новые файлы системы анимаций (опционально)
rm ../src/utils/animations.js
rm ../src/styles/animations.css
```

## PowerShell (Windows)

```powershell
cd backup
$latestBackup = Get-ChildItem "animations-backup-*" | Sort-Object -Descending | Select-Object -First 1

# Восстановите основные файлы
Copy-Item "$latestBackup/custom.css.backup" "../src/custom.css" -Force
Copy-Item "$latestBackup/index.css.backup" "../src/index.css" -Force
Copy-Item "$latestBackup/tailwind.config.js.backup" "../tailwind.config.js" -Force

# Удалите новые файлы системы анимаций (опционально)
Remove-Item "../src/utils/animations.js" -ErrorAction SilentlyContinue
Remove-Item "../src/styles/animations.css" -ErrorAction SilentlyContinue

# Уберите импорт animations.css из main.jsx
# (нужно вручную удалить строку: import './styles/animations.css')
```

## Частичное восстановление

Если нужно восстановить только определенные компоненты:

```bash
# Например, только Button
cp "backup/animations-backup-*/components/Button.jsx.backup" src/components/ui/Button.jsx
```

## Список бекапов

Все бекапы хранятся в папке `backup/` с именами:
- `animations-backup-YYYYMMDD-HHMMSS/`

Каждый бекап содержит:
- `README.md` - информация о бекапе
- `custom.css.backup`
- `index.css.backup`
- `tailwind.config.js.backup`
- `components/` - бекапы критичных компонентов

## Важно

После восстановления убедитесь, что:
1. Удален импорт `animations.css` из `src/main.jsx`
2. Проект компилируется без ошибок
3. Все анимации работают корректно

