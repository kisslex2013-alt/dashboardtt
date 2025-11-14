# 🌳 **GIT WORKFLOW & VERSION CONTROL**

**Версия:** v1.0  
**Дата:** 27.10.2025

---

## 🎯 **СТРАТЕГИЯ КОММИТОВ ВО ВРЕМЯ МИГРАЦИИ**

### **Правило "Один этап - один коммит"**

```bash
# ❌ ПЛОХО
git add .
git commit -m "added stuff"

# ✅ ХОРОШО
git add src/components/ui/Button.jsx
git commit -m "feat: create Button component with glassmorphism"

git add src/hooks/useTimer.js
git commit -m "feat: implement useTimer hook"

git add src/styles/glassmorphism.css
git commit -m "style: add glassmorphism styles"
```

**Почему важно:**

- Легко откатиться к конкретному моменту
- Понятная история изменений
- Проще найти где появилась ошибка

---

## 📝 **CONVENTIONAL COMMITS**

### **Формат:**

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### **Типы коммитов:**

```bash
# Новая функциональность
git commit -m "feat(timer): add pause functionality"

# Исправление бага
git commit -m "fix(timer): correct time calculation"

# Изменение стилей
git commit -m "style(ui): update glassmorphism effects"

# Рефакторинг (без изменения функциональности)
git commit -m "refactor(hooks): optimize useTimer performance"

# Документация
git commit -m "docs: add useTimer hook documentation"

# Тесты
git commit -m "test(timer): add unit tests"

# Обновление зависимостей
git commit -m "chore: update dependencies"

# Изменение сборки
git commit -m "build: configure vite for production"

# CI/CD
git commit -m "ci: add GitHub Actions workflow"
```

---

## 🌿 **BRANCHING STRATEGY**

### **Рекомендуемая структура:**

```
main (production ready)
  └── develop (integration)
       ├── feature/timer-display
       ├── feature/entries-list
       ├── feature/statistics
       └── bugfix/timer-pause-issue
```

### **Создание веток:**

```bash
# Новая фича
git checkout -b feature/timer-display

# Исправление бага
git checkout -b bugfix/timer-not-stopping

# Рефакторинг
git checkout -b refactor/optimize-entries-list

# Эксперимент
git checkout -b experiment/typescript-migration
```

### **Именование веток:**

```
feature/   - новая функциональность
bugfix/    - исправление бага
hotfix/    - срочное исправление
refactor/  - рефакторинг
style/     - изменение стилей
test/      - добавление тестов
docs/      - документация
chore/     - технические изменения
experiment/ - эксперименты
```

---

## 🚀 **WORKFLOW ВО ВРЕМЯ МИГРАЦИИ**

### **Шаг 1: Начало работы над новым компонентом**

```bash
# Убедись что на develop
git checkout develop
git pull

# Создай ветку для компонента
git checkout -b feature/timer-display

# Начинай работу...
```

---

### **Шаг 2: Промежуточные коммиты**

```bash
# После создания структуры
git add src/components/TimerDisplay.jsx
git commit -m "feat(timer): create TimerDisplay component structure"

# После добавления логики
git add src/components/TimerDisplay.jsx
git commit -m "feat(timer): implement timer logic"

# После добавления стилей
git add src/components/TimerDisplay.jsx src/styles/timer.css
git commit -m "style(timer): add glassmorphism styles to TimerDisplay"

# После тестирования
git commit -m "test(timer): verify TimerDisplay functionality"
```

**Правило:** Коммить после каждого логического завершенного шага!

---

### **Шаг 3: Финальная проверка перед мержем**

```bash
# Проверь что всё работает
npm run build
npm run dev

# Убедись что нет лишних файлов
git status

# Посмотри все изменения
git diff develop

# Если всё ок - мержим
git checkout develop
git merge feature/timer-display

# Удали ветку
git branch -d feature/timer-display

# Push в remote
git push origin develop
```

---

## 📸 **СНЭПШОТЫ ПРОГРЕССА**

### **Создавай теги на важных этапах:**

```bash
# После завершения этапа
git tag -a v0.9.0-alpha.1 -m "Basic timer functionality"
git push origin v0.9.0-alpha.1

# После добавления функций
git tag -a v0.9.0-alpha.2 -m "Added entries list"
git push origin v0.9.0-alpha.2

# Рабочий прототип
git tag -a v0.9.0-beta.1 -m "Working prototype with basic features"

# Финальная версия
git tag -a v0.9.0 -m "Full React migration complete"
```

**Просмотр тегов:**

```bash
git tag -l
git show v0.9.0-alpha.1
```

---

## 💾 **ВАЖНЫЕ КОНТРОЛЬНЫЕ ТОЧКИ**

### **Коммить обязательно после:**

1. ✅ **Создания нового компонента**

   ```bash
   git commit -m "feat(ui): create Button component"
   ```

2. ✅ **Создания нового хука**

   ```bash
   git commit -m "feat(hooks): implement useTimer"
   ```

3. ✅ **Успешного переноса функциональности**

   ```bash
   git commit -m "feat(timer): migrate timer logic from HTML"
   ```

4. ✅ **Исправления критического бага**

   ```bash
   git commit -m "fix(timer): prevent memory leak in interval"
   ```

5. ✅ **Завершения этапа**

   ```bash
   git commit -m "feat: complete UI components migration"
   ```

6. ✅ **Перед большими изменениями**
   ```bash
   # Сохрани текущее состояние
   git commit -m "chore: checkpoint before refactoring"
   # Теперь можешь экспериментировать!
   ```

---

## 🔄 **ОТКАТ ИЗМЕНЕНИЙ**

### **Если всё сломалось:**

```bash
# Посмотреть историю
git log --oneline

# Пример вывода:
# abc1234 feat(timer): add pause functionality
# def5678 feat(timer): implement basic timer
# ghi9012 feat(ui): create Button component

# Вернуться к конкретному коммиту (мягкий откат)
git reset --soft ghi9012
# Изменения остаются в staging

# Жесткий откат (ВНИМАНИЕ: потеряешь все изменения!)
git reset --hard ghi9012

# Отменить последний коммит, но оставить изменения
git reset --soft HEAD~1

# Отменить конкретный файл
git checkout HEAD -- src/components/Timer.jsx
```

---

### **Если закоммитил что-то лишнее:**

```bash
# Изменить последний коммит
git commit --amend -m "новое сообщение"

# Добавить забытые файлы в последний коммит
git add forgotten-file.jsx
git commit --amend --no-edit

# Удалить файл из последнего коммита
git reset HEAD^ -- file-to-remove.jsx
git commit --amend
```

---

## 🗂️ **.gitignore ДЛЯ REACT ПРОЕКТА**

### **Создай .gitignore:**

```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
.DS_Store

# Testing
coverage/
.nyc_output/

# Временные файлы
*.tmp
*.temp
.cache/

# Личные заметки
notes.md
TODO.md
```

---

## 🚨 **EMERGENCY: ЧТО ДЕЛАТЬ ЕСЛИ...**

### **Случайно закоммитил в main вместо develop:**

```bash
# 1. Создай ветку с текущими изменениями
git branch emergency-backup

# 2. Вернись на main
git checkout main

# 3. Откати до предыдущего состояния
git reset --hard origin/main

# 4. Вернись к своим изменениям
git checkout emergency-backup

# 5. Создай правильную ветку
git checkout -b feature/my-work

# 6. Продолжай работу
```

---

### **Нужно срочно переключиться на другую задачу:**

```bash
# Сохрани текущую незавершенную работу
git stash save "work in progress on Timer component"

# Переключись на другую ветку
git checkout bugfix/urgent-fix

# ... исправь баг, закоммить, замержить ...

# Вернись к своей работе
git checkout feature/timer-display
git stash pop
```

---

### **Потерял изменения после reset --hard:**

```bash
# Git хранит историю 30 дней!
git reflog

# Найди нужный коммит
# Пример вывода:
# abc1234 HEAD@{0}: reset: moving to HEAD~1
# def5678 HEAD@{1}: commit: feat(timer): add pause

# Вернись к нужному состоянию
git checkout def5678
```

---

## 📊 **ПОЛЕЗНЫЕ GIT КОМАНДЫ**

### **Просмотр истории:**

```bash
# Красивый лог
git log --oneline --graph --decorate --all

# С датами
git log --pretty=format:"%h - %an, %ar : %s"

# Изменения в файле
git log -p src/components/Timer.jsx

# Кто изменял файл
git blame src/components/Timer.jsx

# Изменения за последнюю неделю
git log --since="1 week ago"
```

---

### **Сравнение изменений:**

```bash
# Разница с последним коммитом
git diff

# Разница между ветками
git diff develop feature/timer-display

# Только названия измененных файлов
git diff --name-only

# Статистика изменений
git diff --stat
```

---

### **Работа с ветками:**

```bash
# Список всех веток
git branch -a

# Удалить локальную ветку
git branch -d feature-name

# Удалить remote ветку
git push origin --delete feature-name

# Переименовать ветку
git branch -m old-name new-name

# Показать merged ветки
git branch --merged
```

---

## 🎯 **WORKFLOW ДЛЯ МИГРАЦИИ TIME TRACKER**

### **Рекомендуемая последовательность:**

```bash
# 1. Начальная настройка
git init
git add .
git commit -m "chore: initial React project setup"
git tag -a v0.9.0-setup -m "Project initialized"

# 2. Создание базовой структуры
git checkout -b feature/project-structure
# ... создаешь папки, базовые файлы ...
git commit -m "chore: create project structure"
git checkout develop && git merge feature/project-structure

# 3. Миграция утилит
git checkout -b feature/utilities
git commit -m "feat(utils): migrate performance utilities"
git commit -m "feat(utils): migrate error handler"
git commit -m "feat(utils): migrate DOM utilities"
git checkout develop && git merge feature/utilities
git tag -a v0.9.0-alpha.1 -m "Utilities migrated"

# 4. Миграция хуков
git checkout -b feature/hooks
git commit -m "feat(hooks): implement useLocalStorage"
git commit -m "feat(hooks): implement useTimer"
git commit -m "feat(hooks): implement useNotifications"
git checkout develop && git merge feature/hooks
git tag -a v0.9.0-alpha.2 -m "Hooks implemented"

# 5. Миграция UI компонентов
git checkout -b feature/ui-components
git commit -m "feat(ui): create Button component"
git commit -m "feat(ui): create Input component"
git commit -m "feat(ui): create Modal component"
git checkout develop && git merge feature/ui-components
git tag -a v0.9.0-alpha.3 -m "UI components ready"

# 6. И так далее для каждого этапа...

# После каждого УСПЕШНОГО этапа - создавай тег!
```

---

## 📋 **COMMIT MESSAGE ШАБЛОН**

### **Создай шаблон:**

```bash
# Создай файл .gitmessage
cat > ~/.gitmessage << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Type: feat, fix, docs, style, refactor, test, chore
# Scope: component, hook, util, style, etc.
# Subject: imperative, lowercase, no period
#
# Body: What and why (optional)
# Footer: Breaking changes, issues (optional)
EOF

# Настрой git использовать этот шаблон
git config --global commit.template ~/.gitmessage
```

Теперь при `git commit` (без -m) откроется редактор с шаблоном!

---

## 🔍 **ПРОВЕРКА ПЕРЕД КОММИТОМ**

### **Создай pre-commit checklist:**

```bash
# Создай файл check.sh
cat > check.sh << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# 1. Линтинг
echo "📝 Linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed!"
    exit 1
fi

# 2. Билд
echo "🔨 Building..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 3. Тесты (если есть)
# echo "🧪 Testing..."
# npm test

echo "✅ All checks passed!"
EOF

chmod +x check.sh

# Запускай перед важными коммитами
./check.sh && git commit -m "feat: add new feature"
```

---

## 💡 **PRO TIPS**

### **1. Используй aliases:**

```bash
# Добавь в ~/.gitconfig или ~/.zshrc

alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline --graph'
alias gd='git diff'
alias gco='git checkout'
alias gb='git branch'

# Теперь можно:
gs  # вместо git status
gc "feat: add timer"  # вместо git commit -m "feat: add timer"
```

---

### **2. Git hooks для автоматизации:**

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run lint-staged
npm run build
```

---

### **3. Интерактивное добавление:**

```bash
# Выборочное добавление изменений
git add -p

# Позволяет выбрать какие изменения добавить:
# y - добавить этот chunk
# n - пропустить
# s - разделить на меньшие части
# q - выйти
```

---

### **4. Поиск в истории:**

```bash
# Найти когда был изменен текст в файле
git log -S "useTimer" --source --all

# Найти коммит где была удалена строка
git log -S "old code" --diff-filter=D

# Найти кто создал файл
git log --diff-filter=A -- src/hooks/useTimer.js
```

---

## 📚 **ПОЛЕЗНЫЕ РЕСУРСЫ**

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flight Rules](https://github.com/k88hudson/git-flight-rules)
- [Oh Shit, Git!](https://ohshitgit.com/)
- [Learn Git Branching](https://learngitbranching.js.org/)

---

## 🎓 **РЕЗЮМЕ: ЛУЧШИЕ ПРАКТИКИ**

1. ✅ **Коммить часто** - после каждого логического шага
2. ✅ **Писать понятные сообщения** - используй conventional commits
3. ✅ **Использовать ветки** - для каждой фичи/фикса
4. ✅ **Создавать теги** - на важных этапах
5. ✅ **Проверять перед коммитом** - билд, линт, тесты
6. ✅ **Не коммитить node_modules** - используй .gitignore
7. ✅ **Использовать git stash** - для незавершенной работы
8. ✅ **Делать бэкапы** - git push регулярно
9. ✅ **Читать git log** - понимать историю
10. ✅ **Не бояться ошибок** - git позволяет откатиться!

---

**Git - твой страховочный трос во время миграции. Используй его правильно!** 🌳
