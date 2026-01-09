import{F,j as e,ar as P,z as Y,B as T}from"./route-analytics-ClQyVF1L.js";import{a as m,a6 as b,a1 as p,N as y,f,aa as j,at as N,G as v,az as C,ay as k,ah as w,aG as g,aH as M,n as B,aI as $,B as E,O as H,_ as G,Z as W,w as I}from"./lucide-icons-vendor-DxO0IVr5.js";import{B as z}from"./route-entries-DEojc9MZ.js";import{S as D}from"./SettingsNavItem-B91ptseP.js";import"./date-fns-vendor-C2jYa_1E.js";import"./vendor-C6w6a7VU.js";import"./tone-vendor-DnjenXqh.js";const S=[{id:"basics",title:"Основы",items:[{id:"getting-started",icon:b,title:"Начало работы",subtitle:"Быстрый старт",accentClass:"blue-500"},{id:"timer",icon:p,title:"Таймер",subtitle:"Учёт времени",accentClass:"green-500"},{id:"entries",icon:y,title:"Записи",subtitle:"База данных",accentClass:"violet-500"}]},{id:"analytics",title:"Аналитика",items:[{id:"basic-analytics",icon:f,title:"Базовая",subtitle:"Общая статистика",accentClass:"cyan-500"},{id:"descriptive",icon:j,title:"Описательная",subtitle:"Графики и тренды",accentClass:"indigo-500"},{id:"predictive",icon:N,title:"Предиктивная",subtitle:"Прогнозы",accentClass:"fuchsia-500"},{id:"comparative",icon:v,title:"Сравнительная",subtitle:"MoM и YoY",accentClass:"amber-500"}]},{id:"features",title:"Функции",items:[{id:"view-modes",icon:C,title:"Режимы просмотра",subtitle:"Focus / Analytics",accentClass:"purple-500"},{id:"ai-assistant",icon:k,title:"AI Ассистент",subtitle:"Умные инсайты",accentClass:"rose-500"},{id:"categories",icon:w,title:"Категории",subtitle:"Теги проектов",accentClass:"emerald-500"},{id:"hotkeys",icon:g,title:"Горячие клавиши",subtitle:"Быстрый доступ",accentClass:"sky-500"},{id:"sync",icon:M,title:"Синхронизация",subtitle:"Облако и бэкапы",accentClass:"slate-500"}]}],d=S.flatMap(n=>n.items),Z={"getting-started":{title:"Начало работы",sections:[{heading:"Добро пожаловать!",content:"Time Tracker Dashboard — это современное приложение для учёта рабочего времени и анализа продуктивности. Оно поможет вам отслеживать, сколько времени вы тратите на разные проекты, и покажет полезную аналитику."},{heading:"Первые шаги",content:`1. **Запустите таймер** — нажмите кнопку Play в правом верхнем углу или используйте хоткей T
2. **Выберите категорию** — укажите, над каким проектом работаете
3. **Остановите таймер** — когда закончите, время автоматически сохранится
4. **Посмотрите статистику** — раскройте блоки аналитики для анализа`,icon:G},{tip:"Используйте демо-данные для изучения интерфейса. Их можно удалить в любой момент через Настройки → Данные."}]},timer:{title:"Таймер",sections:[{heading:"Как работает таймер",content:`Таймер отслеживает ваше рабочее время в реальном времени. Есть два способа запуска:

• **Кнопка Play** — в шапке или в разделе "База данных"
• **Хоткей T** — мгновенный запуск/остановка`,icon:p},{heading:"Автосохранение",content:`При остановке таймера запись автоматически:
- Сохраняется в базу данных
- Рассчитывает доход по вашей ставке
- Обновляет статистику и графики`},{heading:"Pomodoro режим",content:"Включите Pomodoro в Настройках → Продуктивность для работы циклами по 25 минут с перерывами.",tip:"Pomodoro и обычный таймер могут работать одновременно!"}]},entries:{title:"База данных записей",sections:[{heading:"Управление записями",content:`Секция "База данных" содержит все ваши записи о работе. Доступно несколько видов отображения:

• **Сетка** — компактные карточки
• **Список** — детальный вид
• **Таймлайн** — хронология
• **Календарь** — по датам`,icon:y},{heading:"Быстрое добавление",content:`Кнопка "+" позволяет создать запись вручную, указав:
- Дату и время
- Длительность
- Категорию/проект
- Почасовую ставку
- Описание`,icon:E},{heading:"Импорт и Экспорт",content:`• **Экспорт** — скачайте все данные в JSON-файл
• **Импорт** — загрузите данные из файла

Это позволяет переносить данные между устройствами и создавать резервные копии.`,icon:H}]},"basic-analytics":{title:"Базовая аналитика",sections:[{heading:"Что показывает",content:`Базовая аналитика — это ваш дашборд с ключевыми метриками:

• **Всего часов** — общее отработанное время
• **Общий доход** — сумма заработка
• **Средняя ставка** — ваша эффективная ставка
• **Количество записей** — сколько сессий работы`,icon:f},{heading:"Фильтрация",content:`Можете выбрать период для анализа:
- Сегодня
- Неделя / Месяц / Год
- Произвольный диапазон дат`},{tip:"Нажмите на иконку Pin рядом с фильтром, чтобы установить его по умолчанию."}]},descriptive:{title:"Описательная аналитика",sections:[{heading:"Графики и визуализации",content:`Раздел содержит детальные графики вашей работы:

• **Динамика доходов** — как менялся заработок
• **Распределение по категориям** — на что уходит время
• **Анализ дней недели** — какие дни самые продуктивные
• **Анализ часов** — в какое время работаете эффективнее`,icon:j},{heading:"Режимы отображения",content:`• **Раздельно** — каждый график отдельно
• **Совместно** — графики на общей оси`},{heading:"Выбор графиков",content:'Кнопка "Графики" позволяет включать/выключать отдельные визуализации по вашему выбору.',tip:"Календарь доходов (Heatmap) показывает интенсивность работы за год!"}]},predictive:{title:"Предиктивная аналитика",sections:[{heading:"Прогнозирование",content:`На основе ваших данных система строит прогнозы:

• **Прогноз заработка** — сколько заработаете к концу месяца/года
• **Тренды** — как меняется ваша продуктивность
• **What-If калькулятор** — моделирование сценариев`,icon:N},{heading:"Анализ выгорания",content:`Виджет "Прогноз выгорания" анализирует:
- Частоту переработок
- Регулярность перерывов
- Паттерны нагрузки

И предупреждает о рисках переутомления.`},{heading:"Сезонность",content:"Heatmap сезонности показывает, в какие месяцы и дни недели вы работаете активнее. Это помогает планировать нагрузку."}]},comparative:{title:"Сравнительная аналитика",sections:[{heading:"Сравнение периодов",content:`Анализируйте изменения вашей продуктивности:

• **MoM (Month-over-Month)** — сравнение с прошлым месяцем
• **YoY (Year-over-Year)** — сравнение с прошлым годом
• **Тренд за 6 месяцев** — среднесрочная динамика`,icon:v},{heading:"Анализ периодов",content:"Показывает ваши лучшие и худшие недели по доходу и отработанным часам."},{heading:"Радар сравнения",content:"Наглядное сравнение текущего и прошлого месяца по 5 метрикам: доход, часы, записи, ставка, продуктивность."}]},"ai-assistant":{title:"AI Ассистент",sections:[{heading:"Умные уведомления",content:`AI анализирует ваши данные и генерирует персональные инсайты:

• **Паттерны продуктивности** — когда вы работаете эффективнее
• **Аномалии** — необычные изменения в данных
• **Рекомендации** — советы по оптимизации`,icon:k},{heading:"Типы уведомлений",content:`• **Инсайт** — интересное наблюдение
• **Достижение** — поздравление с успехом
• **Предупреждение** — внимание к проблеме
• **Совет** — практическая рекомендация`},{heading:"Настройка",content:`В Настройках → AI Ассистент можно:
- Включить/выключить уведомления
- Выбрать типы и приоритеты
- Настроить частоту проверки`,tip:"AI учится на ваших данных — чем больше записей, тем точнее инсайты!"}]},categories:{title:"Категории",sections:[{heading:"Что такое категории",content:"Категории — это теги для ваших рабочих сессий. Они позволяют разделять время по проектам, клиентам или типам задач.",icon:w},{heading:"Создание категорий",content:`В Настройках → Категории можно:

• Добавить новую категорию
• Выбрать цвет и иконку
• Установить почасовую ставку по умолчанию
• Архивировать неиспользуемые`},{heading:"Анализ по категориям",content:`Графики автоматически группируют данные по категориям, показывая:
- Распределение времени
- Доход по проектам
- Эффективность категорий`}]},hotkeys:{title:"Горячие клавиши",sections:[{heading:"Быстрый доступ",content:`Используйте клавиатуру для мгновенных действий:

• **T** — Запуск/остановка таймера
• **N** — Новая запись
• **Ctrl+K** — Командная палитра
• **/** — Поиск
• **F1** — Справка
• **Esc** — Закрыть модальное окно`,icon:g},{heading:"Навигация",content:`• **Ctrl+S** — Сохранить
• **Ctrl+Z** — Отменить
• **Ctrl+Y** — Повторить
• **Ctrl+Shift+E** — Экспорт данных`},{tip:"Все хоткейи можно посмотреть в Настройках → Горячие клавиши"}]},sync:{title:"Синхронизация и бэкапы",sections:[{heading:"Локальное хранение",content:"По умолчанию все данные хранятся локально в браузере (LocalStorage). Это безопасно, но данные привязаны к устройству.",icon:$},{heading:"Облачная синхронизация",content:`Зарегистрируйтесь, чтобы:

• Синхронизировать данные между устройствами
• Автоматически создавать облачные бэкапы
• Не потерять данные при очистке браузера`,icon:M},{heading:"Ручные бэкапы",content:`В Настройках → Данные можно:

• Экспортировать все данные в JSON
• Импортировать из файла
• Создать резервную копию настроек`,tip:"Рекомендуем делать ручной бэкап раз в неделю!"}]},"view-modes":{title:"Режимы просмотра: Focus / Analytics",sections:[{heading:"Два режима работы",content:`Приложение поддерживает два режима интерфейса, которые можно переключать в шапке сайта:

• **Focus Mode** — минималистичный режим для работы
• **Analytics Mode** — полная аналитика и графики`,icon:C},{heading:"Focus Mode 🎯",content:`Режим для концентрации на работе:

• Скрывает всю аналитику и графики
• Оставляет только список записей и таймер
• Идеален для ежедневного использования`},{heading:"Analytics Mode 📊",content:`Полный режим с аналитикой:

• Базовая статистика
• Описательная аналитика (графики)
• Предиктивная аналитика (прогнозы)
• Сравнительная аналитика (MoM, YoY)`},{heading:"Быстрое переключение",content:`• Кнопки в шапке (иконки 🎯 и 📊)
• Горячая клавиша: **Ctrl+Shift+F**`,icon:g},{tip:"Режим сохраняется автоматически и будет активен при следующем открытии приложения!"}]}};function J({sectionId:n,onNext:i,hasNext:x}){const a=Z[n],o=d.find(t=>t.id===n)?.icon;return a?e.jsxs("div",{className:"flex flex-col h-full",children:[e.jsxs("div",{className:"flex-1 space-y-5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[o&&e.jsx(o,{className:"w-7 h-7 text-blue-500"}),e.jsx("h2",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:a.title})]}),a.sections.map((t,u)=>e.jsxs("div",{className:"space-y-2",children:[t.heading&&e.jsxs("div",{className:"flex items-center gap-2",children:[t.icon&&e.jsx(t.icon,{className:"w-5 h-5 text-blue-500"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-800 dark:text-gray-200",children:t.heading})]}),t.content&&e.jsx("div",{className:"text-gray-600 dark:text-gray-300 leading-relaxed pl-0.5",children:t.content.split(`
`).map((l,r)=>{const c=l.split(/(\*\*[^*]+\*\*)/g);return e.jsx("p",{className:"mb-1.5",children:c.map((h,A)=>h.startsWith("**")&&h.endsWith("**")?e.jsx("strong",{className:"font-semibold text-gray-800 dark:text-gray-100",children:h.slice(2,-2)},A):h)},r)})}),t.tip&&e.jsxs("div",{className:"flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800",children:[e.jsx(W,{className:"w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"}),e.jsx("p",{className:"text-sm text-blue-700 dark:text-blue-300",children:t.tip})]})]},u))]}),x&&e.jsx("div",{className:"pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end",children:e.jsxs(T,{onClick:i,className:"bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2",children:["Далее",e.jsx(I,{className:"w-4 h-4"})]})})]}):e.jsxs("div",{className:"flex flex-col items-center justify-center h-full text-center p-8",children:[e.jsx(B,{className:"w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"}),e.jsx("h3",{className:"text-lg font-medium text-gray-500 dark:text-gray-400",children:"Раздел в разработке"}),e.jsx("p",{className:"text-sm text-gray-400 dark:text-gray-500 mt-2",children:"Скоро здесь появится подробная справка"})]})}function K({onSelectSection:n}){return e.jsxs("div",{className:"flex flex-col items-center justify-center h-full text-center p-8",children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg",children:e.jsx(b,{className:"w-10 h-10 text-white"})}),e.jsx("h2",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-3",children:"Справочный центр"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300 max-w-md mb-8",children:"Здесь вы найдёте подробную информацию о всех функциях приложения. Выберите раздел слева или начните с основ."}),e.jsxs("button",{onClick:()=>n("getting-started"),className:"flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/25",children:["Начать изучение",e.jsx(I,{className:"w-5 h-5"})]}),e.jsx("div",{className:"mt-8 grid grid-cols-3 gap-4 max-w-lg",children:[{id:"timer",icon:p,label:"Таймер",color:"text-green-500"},{id:"basic-analytics",icon:f,label:"Аналитика",color:"text-cyan-500"},{id:"hotkeys",icon:g,label:"Хоткеи",color:"text-amber-500"}].map(i=>e.jsxs("button",{onClick:()=>n(i.id),className:"flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",children:[e.jsx(i.icon,{className:`w-6 h-6 ${i.color}`}),e.jsx("span",{className:"text-xs font-medium text-gray-600 dark:text-gray-400",children:i.label})]},i.id))})]})}function V({isOpen:n,onClose:i,initialSection:x=null}){const a=F(),[s,o]=m.useState(x);m.useEffect(()=>{n&&o(x)},[n,x]);const t=m.useCallback(()=>{if(!s){o(d[0].id);return}const l=d.findIndex(r=>r.id===s);l<d.length-1&&o(d[l+1].id)},[s]),u=m.useMemo(()=>s?d.findIndex(r=>r.id===s)<d.length-1:!0,[s]);return e.jsx(z,{isOpen:n,onClose:i,title:"Справка",titleIcon:b,size:"large",className:"!max-w-5xl",disableContentScroll:!0,children:e.jsxs("div",{className:`flex ${a?"flex-col":"flex-row"} -mx-6`,children:[e.jsx("div",{className:`${a?"border-b":"border-r"} border-gray-200 dark:border-gray-700 ${a?"pb-4":"pr-4 w-72 flex-shrink-0"}`,children:e.jsx("nav",{className:`p-4 pl-6 ${a?"flex gap-2 overflow-x-auto pb-2":"flex flex-col gap-2"}`,children:S.map((l,r)=>e.jsxs("div",{className:a?"flex gap-2":"",children:[!a&&e.jsx("div",{className:`
                    px-3 text-sm text-gray-500 dark:text-gray-400 font-medium
                    pb-2
                    ${r>0?"mt-1 pt-1 border-t border-gray-100 dark:border-gray-800":""}
                  `,children:l.title}),e.jsx("div",{className:a?"flex gap-2":"flex flex-col gap-2",children:l.items.map(c=>e.jsx(D,{icon:c.icon,title:c.title,subtitle:c.subtitle,accentClass:c.accentClass,onClick:()=>o(c.id),isActive:s===c.id},c.id))})]},l.id))})}),e.jsx("div",{className:"flex-1 p-6 overflow-hidden",children:e.jsx(P,{mode:"wait",children:e.jsx(Y.div,{initial:{opacity:0,x:10},animate:{opacity:1,x:0},exit:{opacity:0,x:-10},transition:{duration:.15},className:"h-full",children:s?e.jsx(J,{sectionId:s,onNext:t,hasNext:u}):e.jsx(K,{onSelectSection:o})},s||"welcome")})})]})})}export{V as HelpCenterModal,V as default};
