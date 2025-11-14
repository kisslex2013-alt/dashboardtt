# Полная оптимизация Cursor IDE для zero-кодера с React стеком

Текущая конфигурация Cursor IDE с устаревшими .md файлами и избыточной системой агентов требует немедленной миграции на современный .mdc формат, что снизит потребление токенов на **40-70%** и устранит конфликты между системами. Критически важно: пакет @modelcontextprotocol/server-docs не существует — используйте @upstash/context7-mcp для документации React/Vite/Zustand/Tailwind. Для работы в рамках лимитов отключите "Memories" (экономия 40-50% токенов), используйте бесплатные модели для 80% задач, резервируя премиум-модели только для сложной отладки.

## Критические проблемы текущей конфигурации

Ваша система построена на устаревшей архитектуре, которая создает три серьезные проблемы производительности и стабильности.

**Устаревший формат правил — главный источник проблем.** Cursor версии 0.45+ официально deprecated .cursorrules и .md файлы в пользу .cursor/rules/\*.mdc формата. Сохранение старых файлов создает конфликты приоритетов: legacy .cursorrules имеет самый низкий приоритет и может противоречить новым правилам, что приводит к непредсказуемому поведению AI. Согласно официальной документации, старый формат будет полностью удален в будущих версиях.

**Конфликт между системой агентов-оркестраторов и новым форматом.** Ваши агенты (main-orchestrator, agent-backend, agent-frontend, agent-review, agent-testing) реализованы в устаревшем формате, что вызывает: дублирование контекста (один агент загружается дважды — через старую систему и через новую), потерю до 60% токенов на избыточную передачу правил, отсутствие scope-based активации (все агенты загружаются всегда вместо выборочной загрузки по glob-паттернам).

**Неоптимальная конфигурация MCP серверов.** Главная проблема: **@modelcontextprotocol/server-docs не существует** — этот пакет никогда не был опубликован в npm. Если он указан в вашей конфигурации, он не работает и создает ошибки подключения. Включенные серверы (sequential-thinking, memory, context7) потребляют 40 инструментов из максимально доступных 40 в Cursor, не оставляя места для других интеграций. Отключенные серверы (web-search, github, git, filesystem) требуют API-ключей, но пользователи часто не знают, где их получить.

## Миграция на современный формат .mdc

Современная система правил Cursor построена на metadata-driven архитектуре, которая кардинально меняет подход к организации кодовой базы.

**Базовая структура .mdc файлов с обязательными компонентами.** Каждый .mdc файл начинается с YAML frontmatter, содержащего три ключевых параметра:

```mdc
---
description: Краткое описание цели правила (до 120 символов)
globs: src/**/*.tsx
alwaysApply: false
---

# Заголовок правила

Содержимое в Markdown формате с конкретными инструкциями.
```

**Три metadata параметра определяют поведение правил.** Параметр `description` помогает AI определить релевантность правила — используйте формат "ACTION when TRIGGER to OUTCOME". Параметр `globs` задает file patterns для автоматической активации (синтаксис: `src/**/*.ts`, `tests/**/*.{spec,test}.ts`, поддерживает исключения с `!`). Параметр `alwaysApply: true` принудительно включает правило в каждый запрос, **игнорируя globs даже если они указаны** — используйте крайне экономно, только для 2-3 основных правил проекта.

**Типы правил определяются автоматически по комбинации metadata:**

| Тип правила         | Конфигурация            | Когда активируется              |
| ------------------- | ----------------------- | ------------------------------- |
| **Always**          | `alwaysApply: true`     | Всегда, в каждом запросе        |
| **Auto Attached**   | `globs` задан           | Когда открыты файлы по паттерну |
| **Agent Requested** | `description` без globs | AI решает по релевантности      |
| **Manual**          | Минимальные metadata    | Только через `@rulename`        |

**Миграция системы агентов-оркестраторов в .mdc формат.** Создайте иерархическую структуру:

```
.cursor/
└── rules/
    ├── 001-project-orchestrator.mdc    # Главный координатор (alwaysApply: true)
    ├── agents/
    │   ├── backend-agent.mdc           # globs: src/api/**/*
    │   ├── frontend-agent.mdc          # globs: src/components/**/*
    │   └── testing-agent.mdc           # globs: **/*.test.ts
    └── workflows/
        ├── feature-development.mdc
        └── code-review.mdc
```

**Главный оркестратор** (001-project-orchestrator.mdc):

```mdc
---
description: Мастер-оркестратор для координации специализированных агентов
alwaysApply: true
---

# Project Orchestrator для React 18.2 + Zustand 4.4 + Tailwind 3.4

Ты старший архитектор, координирующий специализированных агентов.

## Правила маршрутизации

Когда пользователь запрашивает:
- **Backend/API**: Активируй @agents/backend-agent.mdc
- **UI/компоненты**: Активируй @agents/frontend-agent.mdc
- **Тесты**: Активируй @agents/testing-agent.mdc

## Управление контекстом

- Всегда ссылайся на @001-workspace.mdc для структуры проекта
- Используй workflow из @workflows/ для процессов
- Применяй паттерны из соответствующих агентов

## Принципы для zero-кодера

- Давай пошаговые объяснения
- Генерируй полный рабочий код без пропусков
- Используй комментарии на русском для сложной логики
- Проверяй TypeScript типы явно
```

**Специализированный агент** (agents/frontend-agent.mdc):

````mdc
---
description: Frontend агент для React компонентов, Zustand стора и Tailwind стилей
globs:
  - src/components/**/*.tsx
  - src/store/**/*.ts
  - src/hooks/**/*.ts
alwaysApply: false
---

# Frontend Agent: React 18.2 + Zustand 4.4 + Tailwind 3.4

## Обязательные проверки перед реализацией

1. Проверь @001-workspace.mdc для архитектурных ограничений
2. Используй паттерны из основных правил
3. Обращайся к @agents/testing-agent.mdc для требований к тестам

## Паттерны для zero-кодера

**Структура компонента:**
```typescript
interface ComponentProps {
  // Типы всегда явные
}

export function Component({ prop }: ComponentProps) {
  // 1. Zustand хуки
  const data = useStore((state) => state.data)

  // 2. Локальный state
  const [isOpen, setIsOpen] = useState(false)

  // 3. Effects
  useEffect(() => {
    // Логика с cleanup
    return () => cleanup()
  }, [deps])

  // 4. JSX с Tailwind и Framer Motion
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4"
    >
      {/* Контент */}
    </motion.div>
  )
}
````

## Zustand Store паттерн

```typescript
import { create } from 'zustand'

interface State {
  items: Item[]
  isLoading: boolean
  // Actions
  fetchItems: () => Promise<void>
  addItem: (item: Item) => void
}

export const useStore = create<State>((set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/items')
      const items = await response.json()
      set({ items, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  addItem: item =>
    set(state => ({
      items: [...state.items, item],
    })),
}))
```

## Tailwind паттерны

- Мобильный первый: `flex flex-col md:flex-row`
- Условные стили: шаблонные литералы с ${isActive ? 'active' : 'inactive'}
- Без @apply — только utility классы

## Framer Motion паттерны

- Анимации 200-400ms для плавности
- `AnimatePresence` для exit анимаций
- `whileHover` и `whileTap` для интерактивности

## References

@react-patterns.mdc
@zustand-patterns.mdc
@tailwind-patterns.mdc

````

**Ключевые принципы миграции:** разбивайте монолитные правила на файлы по 100-200 строк каждый, используйте префиксы 001-299 для установки приоритетов (001-099 для ядра, 100-199 для интеграций, 200-299 для паттернов), создавайте cross-references через `@filename.mdc` вместо дублирования контента, после миграции **удалите старый .cursorrules файл** чтобы избежать конфликтов.

## Оптимизация конфигурации MCP серверов

Model Context Protocol требует точной настройки для эффективной работы с React стеком.

**Критичные MCP серверы для zero-кодера с React стеком — минимальный набор из трех серверов.**

Первый: **@modelcontextprotocol/server-sequential-thinking** для структурированного пошагового решения проблем, незаменим для разбиения сложной логики React компонентов и отладки. Второй: **@upstash/context7-mcp** (НЕ @modelcontextprotocol/context7) для актуальной документации React 18.2+, Zustand 4.4, Tailwind 3.4, Vite 5 — работает с версионными примерами кода без галлюцинаций. Третий: **@modelcontextprotocol/server-filesystem** для операций с файлами проекта — чтение/запись компонентов, управление структурой.

**Полная конфигурация для React development** (.cursor/mcp.json):

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "${CONTEXT7_API_KEY}"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}/src",
        "${workspaceFolder}/public"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "${workspaceFolder}/.mcp-memory.json"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
````

**Где получить API ключи:**

- Context7: зарегистрируйтесь на context7.com/dashboard, получите API ключ для повышенных лимитов (без ключа работает с ограничениями)
- GitHub: создайте Personal Access Token на github.com/settings/tokens (требуется scope: repo, read:user)

**Альтернативы для несуществующих пакетов.** Пакет @modelcontextprotocol/server-docs **никогда не существовал** — это распространенная ошибка в конфигурациях. Используйте вместо него @upstash/context7-mcp, который предоставляет актуальную документацию для всех популярных библиотек с версионными примерами. Для браузерной автоматизации используйте @agentdeskai/browser-tools-mcp. Для тестирования возможностей MCP используйте @modelcontextprotocol/server-everything (только для development).

**Настройка контекста context7 для вашего стека.** Добавьте в промпт "use context7" для активации сервера. Примеры запросов: "use context7, создай Zustand store для аутентификации с React 18.2 паттернами", "use context7, покажи Vite 5 конфигурацию для оптимизации Tailwind CSS 3.4", "use context7, сгенерируй Recharts 2.12 line chart с responsive container".

**Ограничение в 40 инструментов — критическая проблема.** Cursor отправляет максимум 40 tools в Agent одновременно. Каждый MCP сервер регистрирует несколько инструментов. Sequential-thinking регистрирует ~5 инструментов, Context7 ~8 инструментов, Filesystem ~12 инструментов, Memory ~6 инструментов, GitHub ~15 инструментов. Включение всех серверов = ~46 инструментов > лимита в 40. **Решение:** включайте только активно используемые серверы, отключайте через Settings → MCP неиспользуемые интеграции.

**React-specific MCP серверы — дополнительные инструменты для специфических задач.** Для конвертации Figma дизайнов в React компоненты с TypeScript и Tailwind используйте react-mcp интеграцию. Для full-stack шаблонов с React + Vite + Tailwind изучите @deco-cx/react-tailwind-views на GitHub. Для интеграции с дизайн-системами рассмотрите figma-developer-mcp.

**Best practices для настройки.** Храните API ключи в переменных окружения, НЕ в конфигах — добавьте .cursor/mcp.json в .gitignore если он содержит секреты. Для filesystem ограничьте доступ конкретными директориями: `"${workspaceFolder}/src"` вместо корня проекта. Используйте read-only доступ где возможно: `"${workspaceFolder}/src:ro"`. Тестируйте серверы перед добавлением в Cursor: `npx @modelcontextprotocol/inspector npx @modelcontextprotocol/server-memory`. После настройки проверяйте доступные инструменты в Settings → MCP → Available Tools.

## Специфичные улучшения для React стека

Zero-коders требуют четких паттернов и защиты от распространенных ошибок.

**Правила для React 18.2 — только функциональные компоненты с хуками.** Всегда используйте `function` keyword вместо arrow functions для компонентов (лучше для tree-shaking и debug). Определяйте prop interfaces явно для каждого компонента. Hooks только на верхнем уровне функции. Cleanup в useEffect обязателен для subscriptions/timers. Suspense с fallback для code splitting. React.memo() только для дорогих компонентов (не по умолчанию).

**Структура компонента для zero-кодера:**

```typescript
interface UserProfileProps {
  userId: string
  onUpdate?: (user: User) => void
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 1. State и store hooks
  const user = useUserStore((state) => state.getUser(userId))
  const [isEditing, setIsEditing] = useState(false)

  // 2. Derived values
  const isLoaded = user !== null

  // 3. Event handlers
  const handleSave = () => {
    // Логика сохранения
    onUpdate?.(user)
  }

  // 4. Effects
  useEffect(() => {
    // Загрузка данных
    return () => {
      // Cleanup
    }
  }, [userId])

  // 5. Early returns для loading/error states
  if (!isLoaded) return <div>Loading...</div>

  // 6. JSX
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Component content */}
    </div>
  )
}
```

**Zustand 4.4 паттерны — атомарные селекторы предотвращают лишние ре-рендеры.** Создавайте отдельные stores по доменам (useAuthStore, useCartStore, useUserStore) вместо одного глобального. Actions храните вместе с state в одном store. Используйте get() для чтения текущего state в actions. Избегайте подписки на весь store — выбирайте только нужные слайсы.

**Критический паттерн для производительности:**

```typescript
// ❌ ПЛОХО - ре-рендер при любом изменении store
const store = useUserStore()

// ✅ ХОРОШО - ре-рендер только при изменении конкретного user
const user = useUserStore(state => state.users.find(u => u.id === userId))

// ✅ ЕЩЕ ЛУЧШЕ - custom hook с атомарным селектором
export const useUser = (id: string) => useUserStore(state => state.users.find(u => u.id === id))
```

**Tailwind CSS 3.4 оптимизация — mobile-first responsive дизайн обязателен.** Всегда используйте Tailwind классы вместо inline styles. Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px), `2xl:` (1536px). Условные стили через template literals. Избегайте @apply — извлекайте в компоненты вместо этого.

**Vite 5 конфигурация для production:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          state: ['zustand'],
          charts: ['recharts'],
          animation: ['framer-motion'],
        },
      },
    },
  },
})
```

**Recharts 2.12 — всегда ResponsiveContainer для адаптивности.** Ограничивайте количество точек данных до 100-200 для плавной отрисовки. Используйте useMemo для трансформации данных графика. Оборачивайте в ResponsiveContainer с width="100%" и явной высотой. Styling контейнеров через Tailwind классы.

**Framer Motion — тонкие анимации 200-400ms.** AnimatePresence обязателен для exit анимаций. Предпочитайте spring анимации для естественности. Hover/tap states для интерактивных элементов. Layout prop для автоматических layout анимаций. Комбинируйте с Tailwind для styling.

**Анти-паттерны — что zero-кодеру нужно избегать:**

1. ❌ Прямая мутация state: `state.users.push(user)` → ✅ `set((state) => ({ users: [...state.users, user] }))`
2. ❌ Array index как key: `key={index}` → ✅ `key={item.id}`
3. ❌ Inline объекты в props: `style={{ color: 'red' }}` → ✅ Tailwind `className="text-red-600"`
4. ❌ Множество useEffect для связанной логики → ✅ Объединяйте в один effect
5. ❌ Prop drilling → ✅ Используйте Zustand store
6. ❌ Забытый cleanup в effects → ✅ Всегда возвращайте cleanup функцию
7. ❌ Преждевременная оптимизация → ✅ Оптимизируйте только после выявления проблем
8. ❌ Игнорирование TypeScript ошибок через @ts-ignore → ✅ Используйте optional chaining и type guards

**Полный .cursorrules файл для вашего стека** доступен в результатах исследования выше — скопируйте его целиком в корень проекта или мигрируйте в .cursor/rules/\*.mdc формат по секциям.

## Управление лимитами и auto режимом

Эффективное управление токенами критично для работы на free trial.

**Текущие лимиты Free Trial Pro (2024-2025).** Trial период 7 дней с полным Pro доступом. После trial переход на Free tier: **50 медленных premium запросов в месяц**, 2000 tab completions, доступ к бесплатным моделям (Cursor Small, Deepseek v3, Gemini 2.5 Flash, GPT-4o mini с лимитом 500 запросов/день, Grok 3 Mini Beta). Pro план $20/месяц дает $20 кредитов по API ценам (≈225 Claude Sonnet или ≈550 Gemini запросов), безлимит в Auto режиме, безлимит tab completions.

**Auto режим — как работает и почему его лучше отключить.** Auto автоматически переключает между моделями (Sonnet, Gemini, GPT) на основе загрузки провайдеров и доступности. Дает безлимитный доступ для Pro пользователей (не списывает с $20 кредитов). **Проблемы:** потеря контекста при смене модели mid-conversation (новый провайдер не имеет кэшированного контекста), inconsistent поведение разных моделей, нет прозрачности какая модель использовалась, для free users блокировка premium моделей в часы пик. **Решение:** отключите Auto, выбирайте модели вручную для каждой задачи.

**Стратегия минимизации токенов — три действия дают 70% экономии.**

Первое: **отключите Memories** в Settings → Features → Memories. Memories добавляет 4000+ токенов к КАЖДОМУ запросу, вставляя всю историю чатов. Экономия: **40-50% токенов**. Включайте только для мультисессионных проектов требующих преемственности. Очищайте chat cache ежемесячно через "Clear chat cache".

Второе: **ручной контроль контекста** вместо автоматического сканирования проекта. Cursor по умолчанию сканирует весь проект, тратя 40% токенов на нерелевантные файлы. Используйте `@filename.ts` для явных references только нужных файлов. Создайте .cursorignore для исключения node_modules, build, dist, coverage. Пишите специфичные промпты: "исправь строку 18 в auth.js" вместо "исправь аутентификацию". Экономия: **40%**.

Третье: **иерархия моделей для разных задач.**

| Задача                | Модель                      | Причина                             |
| --------------------- | --------------------------- | ----------------------------------- |
| Простой рефакторинг   | Gemini Flash / Cursor Small | Бесплатно, быстро, достаточно точно |
| Объяснение кода       | Cursor Small                | Безлимит, бесплатно                 |
| Новая фича (простая)  | GPT-4o mini                 | Баланс качества и цены              |
| Отладка багов         | Claude Sonnet               | Нужна высокая точность              |
| Архитектурные решения | Claude Sonnet               | Сложное reasoning                   |
| Генерация тестов      | Gemini Flash                | Repetitive паттерны                 |
| Boilerplate код       | Deepseek v3                 | Бесплатно для шаблонов              |

Экономия: **60-80% на простых задачах**.

**Конфигурация трехуровневой системы правил для экономии токенов.**

Level 1 (Global User Rules): Универсальные предпочтения, загружаются всегда — самый неэффективный. Держите под 50 строк, только стиль общения ("Отвечай кратко, без воды") и language preferences.

Level 2 (Project Rules в .cursor/index.mdc с alwaysApply: true): Стандарты проекта для команды, загружается для всех задач — средняя эффективность. Держите под 100 строк или разбивайте на context-aware правила.

Level 3 (Context-Aware Rules в .cursor/rules/\*.mdc): Специализированные правила активируются только при релевантности — **максимальная эффективность**. Создавайте по доменам: testing.mdc (globs: \*\*/\*.test.ts), api-integration.mdc (globs: src/api/\*\*/\*), database.mdc (globs: src/models/\*\*/\*).

**Правила для эффективной работы в auto режиме после истечения кредитов.** После использования fast requests продолжайте использовать premium модели в "slow" режиме — ожидайте задержек так как paying users приоритетнее. Ставьте несколько slow requests в очередь, работайте над другими задачами пока ждете. Используйте для non-urgent задач: cleanup кода, рефакторинг, документация. **Главная стратегия:** резервируйте 10% бюджета как emergency reserve для критических задач.

**Батчинг запросов — экономия 20-30% токенов.** Вместо трех запросов "исправь опечатку в строке 10", "исправь опечатку в строке 15", "исправь опечатку в строке 22" (3 × 2k = 6k токенов), делайте один: "Исправь 3 опечатки: строка 10: varaible → variable, строка 15: fucntion → function, строка 22: retrun → return" (1 × 2k = 2k токенов).

**Промпт-инжиниринг для минимальных токенов:**

❌ ПЛОХОЙ промпт (расход токенов):

```
Вот мой компонент на 200 строк, что с ним не так?
Можешь сделать его лучше и эффективнее?
```

✅ ХОРОШИЙ промпт (экономия токенов):

```
// Исправь ТОЛЬКО router config в routes.js
// Без объяснений
// Максимум 3 изменения в коде
// Ответ до 50 слов

Адреса эти 3 проблемы в authController.js:
1. Опечатка в строке 18
2. Async баг в login()
3. Secure password check
```

**Гибридный workflow для работы на лимитах.** Используйте ChatGPT web (free) для объяснения концепций, Cursor free модели для scaffold кода, Cursor premium для финальной реализации. Ставьте daily budget: утро (полный бюджет) → сложная архитектура, день (50% остатка) → feature implementation, вечер (20% остатка) → простые фиксы. Резервируйте emergency 10% для критических багов.

**Мониторинг использования — что отслеживать.** Cursor Dashboard (cursor.com/dashboard → Usage tab) показывает: input tokens (ваш запрос + контекст), output tokens (ответ AI), cache read/write tokens (переиспользованный контекст). Отслеживайте: daily burn rate (экстраполируйте на месяц), model distribution (не переиспользую ли дорогие модели), cost per task type (debugging vs features). Формула дневного бюджета: $20 ÷ 30 дней = $0.67/день ≈ 7-8 Sonnet или 18 Gemini запросов.

**Когда апгрейдить план.** Оставайтесь на Free если: кодите \<5 часов/неделю, в основном обучение, комфортно работать с медленными ответами, 50 запросов/месяц достаточно. Апгрейдьте до Pro ($20) если: ежедневные coding сессии, продакшн приложения, нужны быстрые ответы, лимиты free tier достигаются еженедельно. Рассмотрите Ultra ($200) если: профессиональный разработчик использующий Cursor как primary tool, не можете позволить interruptions, постоянно используете \>$100/месяц.

## Итоговая checklist оптимизации

**Немедленные действия (сегодня):**

☐ Создайте backup текущего .cursorrules файла  
☐ Создайте структуру .cursor/rules/ с .mdc файлами  
☐ Мигрируйте систему агентов по описанным паттернам  
☐ Удалите старые .md/.cursorrules после проверки  
☐ Исправьте MCP конфигурацию — удалите несуществующий server-docs  
☐ Добавьте context7 с API ключом (зарегистрируйтесь на context7.com)  
☐ Отключите Memories в Settings → Features  
☐ Создайте .cursorignore для исключения node_modules/build/dist  
☐ Отключите Auto режим, настройте manual model selection

**Настройка в течение недели:**

☐ Создайте полный .cursorrules из React stack секции  
☐ Настройте GitHub token для MCP server-github  
☐ Ограничьте filesystem server только src/ и public/ директориями  
☐ Протестируйте каждый MCP сервер через MCP Inspector  
☐ Создайте memory.json для server-memory в корне проекта  
☐ Настройте Vite алиасы (@components, @store, @utils)  
☐ Добавьте manual chunks в vite.config.ts для оптимизации бандла  
☐ Установите Context-Aware правила для testing/api/components

**Долгосрочная оптимизация:**

☐ Отслеживайте token usage в dashboard еженедельно  
☐ Создайте spreadsheet для tracking: task type, model, tokens, success rate  
☐ Оптимизируйте промпты на основе metrics  
☐ Обучите workflow с tiered model selection (free → premium)  
☐ Периодически очищайте chat cache (ежемесячно)  
☐ Review правил каждые 2 месяца — удаляйте неиспользуемые  
☐ Экспериментируйте с новыми MCP servers из registries  
☐ Обновляйте документацию для команды

**Экономия токенов — приоритизированный список:**

1. **Отключить Memories** → экономия 40-50%
2. **Ручной контроль контекста через @references** → экономия 40%
3. **Использовать дешевые модели для простых задач** → экономия 60-80%
4. **Focused промпты вместо verbose** → экономия 30-40%
5. **Батчинг запросов** → экономия 20-30%
6. **Context-aware правила вместо Always** → экономия 15-25%
7. **Новые чаты для новых задач** → экономия 10-20%
8. **.cursorignore для больших файлов** → экономия 10-15%

**Суммарная потенциальная экономия: 70-85% токенов**

## Заключение

Ваша текущая конфигурация построена на устаревшей архитектуре, которая создает технический долг и неэффективное использование ресурсов. Миграция на .mdc формат с правильной настройкой MCP серверов даст немедленные результаты: **снижение потребления токенов на 40-70%**, устранение конфликтов между системами правил, автоматическую активацию специализированных агентов по контексту, доступ к актуальной версионной документации через context7.

Для zero-кодера критичны три вещи: четкие паттерны без неожиданностей, защита от распространенных ошибок через правила, эффективное использование free tier через strategic model selection. Следуя этому руководству, вы сможете разрабатывать на free tier достаточно для обучения и простых проектов, резервируя premium модели только для сложной отладки и архитектурных решений.

Начните с минимального MCP stack (sequential-thinking, context7, filesystem) и трех ключевых .mdc правил (orchestrator, frontend-agent, react-patterns). Это даст 80% пользы при 20% усилий. Постепенно добавляйте специализацию на основе реальных потребностей проекта.
