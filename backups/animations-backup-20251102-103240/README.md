# Backup анимаций - 2025-11-02 10:32:45

Этот бекап содержит текущие (исходные) анимации проекта до унификации.

## Содержимое:

- custom.css.backup - оригинальный файл со всеми CSS анимациями
- index.css.backup - оригинальный index.css
- 	ailwind.config.js.backup - оригинальная конфигурация Tailwind
- components/ - бекапы критичных компонентов с анимациями:
  - Button.jsx.backup
  - EntryItem.jsx.backup
  - BaseModal.jsx.backup
  - Notification.jsx.backup
  - FloatingPanel.jsx.backup

## Как восстановить:

См. файл ../RESTORE_ANIMATIONS.md в папке backup/

## Что было изменено:

После этого бекапа были созданы:
- src/utils/animations.js - новая система утилит для анимаций
- src/styles/animations.css - новый файл с унифицированными анимациями
- Обновлен 	ailwind.config.js с новыми анимациями
- Все компоненты будут унифицированы с новой системой
