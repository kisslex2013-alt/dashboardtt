Техническое задание: Исправление анимации AnimatedModalContent при уменьшении размера
🔴 Проблема
AnimatedModalContent работает корректно при увеличении размера контента, но при уменьшении происходит:

Либо анимация не срабатывает вообще
Либо происходит резкий рывок без плавного перехода

🔍 Анализ причины
Корневая проблема: overflow: visible
В текущей реализации:
jsxstyle={{
  transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  overflow: isChanging ? 'hidden' : 'visible', // ❌ ПРОБЛЕМА ЗДЕСЬ
}}

```

**Почему это создает проблему при уменьшении:**

1. **При увеличении размера:**
```

1.  Текущая высота: 200px, overflow: visible
2.  Устанавливаем height: 200px, overflow: hidden
3.  Новый контент рендерится (300px)
4.  Анимируем height: 200px → 300px
5.  Контент видим, плавно увеличивается ✅

```

2. **При уменьшении размера:**
```

1.  Текущая высота: 300px, overflow: visible
2.  Устанавливаем height: 300px, overflow: hidden
3.  Fade out (контент все еще 300px)
4.  Новый контент рендерится (200px)
5.  Измеряем: scrollHeight = 200px
6.  Анимируем height: 300px → 200px
7.  НО: новый контент уже меньше, он "болтается" внутри
8.  overflow: hidden скрывает проблему, но после анимации
    возвращается overflow: visible слишком рано ❌
    Дополнительные проблемы:

Измерение scrollHeight после смены контента

scrollHeight возвращает реальную высоту нового контента
Но при уменьшении старая высота фиксирована
Контейнер уже имеет больший размер

Порядок операций с overflow

overflow: visible возвращается до завершения всех анимаций
Это вызывает "проскакивание" контента

Отсутствие фиксации высоты после fade-in

height: auto устанавливается слишком рано
Браузер пересчитывает layout до завершения визуального перехода

✅ Решение
Стратегия исправления:

Держать overflow: hidden дольше

До полного завершения всех анимаций
Включая возврат к height: auto

Правильная последовательность измерений

Фиксировать старую высоту ДО fade-out
Измерять новую высоту ПОСЛЕ смены контента
Использовать getBoundingClientRect() вместо scrollHeight

Синхронизация таймингов

Fade-out → Смена контента → RAF → Изменение высоты → Задержка → Fade-in → Задержка → Auto + Visible

🛠️ Исправленный код AnimatedModalContent.jsx
jsximport { useState, useEffect, useRef } from 'react';

/\*\*

- Wrapper для контента модального окна с анимацией при изменении
-
- ИСПРАВЛЕНО: Теперь корректно работает как при увеличении, так и при уменьшении размера
-
- @param {React.ReactNode} children - Контент для отображения
- @param {string|number} contentKey - Ключ для отслеживания смены контента
- @param {number} fadeOutDuration - Длительность затухания (мс)
- @param {number} heightDuration - Длительность изменения высоты (мс)
  \*/
  export function AnimatedModalContent({
  children,
  contentKey,
  fadeOutDuration = 250,
  heightDuration = 350
  }) {
  const [isChanging, setIsChanging] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(children);
  const contentRef = useRef(null);
  const previousKeyRef = useRef(contentKey);
  // НОВОЕ: Отдельное состояние для управления overflow
  const [shouldHideOverflow, setShouldHideOverflow] = useState(false);

useEffect(() => {
// Проверяем, изменился ли ключ контента
if (previousKeyRef.current === contentKey) {
// Ключ не изменился - просто обновляем контент
setDisplayedContent(children);
return;
}

    const contentElement = contentRef.current;
    if (!contentElement) {
      setDisplayedContent(children);
      previousKeyRef.current = contentKey;
      return;
    }

    // Ключ изменился - запускаем анимацию

    // 1. Фиксируем текущую высоту ПЕРЕД любыми изменениями
    const currentHeight = contentElement.getBoundingClientRect().height;
    contentElement.style.height = `${currentHeight}px`;

    // 2. СРАЗУ включаем overflow: hidden для всей анимации
    setShouldHideOverflow(true);

    // 3. Начинаем затухание
    setIsChanging(true);

    // 4. После затухания меняем контент
    setTimeout(() => {
      setDisplayedContent(children);
      previousKeyRef.current = contentKey;

      // 5. Ждем следующий кадр для измерения новой высоты
      requestAnimationFrame(() => {
        // Временно устанавливаем height: auto чтобы измерить реальную высоту
        contentElement.style.height = 'auto';
        const newHeight = contentElement.getBoundingClientRect().height;

        // Возвращаем старую высоту для начала анимации
        contentElement.style.height = `${currentHeight}px`;

        // Еще один RAF для гарантии, что браузер применил изменения
        requestAnimationFrame(() => {
          // 6. Анимируем к новой высоте
          contentElement.style.height = `${newHeight}px`;

          // 7. Запускаем появление после небольшой задержки
          setTimeout(() => {
            setIsChanging(false);

            // 8. После завершения ВСЕХ анимаций возвращаем auto и visible
            setTimeout(() => {
              if (contentElement) {
                contentElement.style.height = 'auto';
                // Возвращаем overflow: visible только после полного завершения
                setShouldHideOverflow(false);
              }
            }, heightDuration); // Ждем полного завершения анимации высоты
          }, 50);
        });
      });
    }, fadeOutDuration);

}, [contentKey, children, fadeOutDuration, heightDuration]);

return (

<div
ref={contentRef}
className="mb-6"
style={{
        transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        // ИСПРАВЛЕНО: overflow: hidden держится до полного завершения всех анимаций
        overflow: shouldHideOverflow ? 'hidden' : 'visible',
      }} >
<div
className="content-wrapper"
style={{
          transition: `opacity ${fadeOutDuration}ms ease-in-out`,
          opacity: isChanging ? 0 : 1,
          pointerEvents: isChanging ? 'none' : 'auto',
        }} >
{displayedContent}
</div>
</div>
);
}
📝 Ключевые изменения

1. Новое состояние shouldHideOverflow
   jsxconst [shouldHideOverflow, setShouldHideOverflow] = useState(false);

Отдельное управление overflow
Не зависит от состояния isChanging
Включается сразу, выключается в самом конце

2. Использование getBoundingClientRect() вместо scrollHeight
   jsx// Было:
   const currentHeight = contentElement.scrollHeight;

// Стало:
const currentHeight = contentElement.getBoundingClientRect().height;
Преимущества:

Более точное измерение реальной высоты
Учитывает padding, border
Меньше проблем с overflow

3. Правильное измерение новой высоты
   jsx// Временно устанавливаем height: auto
   contentElement.style.height = 'auto';
   const newHeight = contentElement.getBoundingClientRect().height;

// Возвращаем старую высоту для анимации
contentElement.style.height = `${currentHeight}px`;

// Запускаем анимацию к новой высоте
requestAnimationFrame(() => {
contentElement.style.height = `${newHeight}px`;
});
Зачем нужен height: auto перед измерением:

Новый контент может быть любого размера
height: auto позволяет контенту занять естественную высоту
Измеряем, затем возвращаем старую высоту для плавной анимации

4. Двойной requestAnimationFrame
   jsxrequestAnimationFrame(() => {
   contentElement.style.height = 'auto';
   const newHeight = contentElement.getBoundingClientRect().height;
   contentElement.style.height = `${currentHeight}px`;

requestAnimationFrame(() => {
contentElement.style.height = `${newHeight}px`;
});
});
Зачем два RAF:

Первый RAF: измеряем новую высоту
Второй RAF: гарантируем, что браузер применил height: currentHeight
Без этого анимация может не сработать

5. Правильный тайминг возврата overflow: visible
   jsxsetTimeout(() => {
   contentElement.style.height = 'auto';
   setShouldHideOverflow(false); // Только после завершения анимации
   }, heightDuration);

```

## 📊 Новая временная диаграмма
```

| Время     | Действие                        | overflow | opacity | height  |
| --------- | ------------------------------- | -------- | ------- | ------- |
| 0ms       | Фиксация текущей высоты         | hidden   | 1       | 200px   |
| 0ms       | Начало fade-out                 | hidden   | 1→0     | 200px   |
| 250ms     | Смена контента                  | hidden   | 0       | 200px   |
| 250ms     | Измерение: auto → measure → old | hidden   | 0       | 200px   |
| 250ms+RAF | Анимация высоты начинается      | hidden   | 0       | 200→100 |
| 300ms     | Начало fade-in                  | hidden   | 0→1     | 200→100 |
| 600ms     | Завершение анимации высоты      | hidden   | 1       | 100px   |
| 600ms     | Возврат auto + visible          | visible  | 1       | auto    |

```

## 🎯 Что это исправляет

### При увеличении (200px → 300px):
✅ Плавная анимация высоты
✅ Контент не обрезается
✅ Нет скачков

### При уменьшении (300px → 200px):
✅ Плавная анимация высоты
✅ Старый контент не "болтается"
✅ Нет резких рывков
✅ `overflow: hidden` держится до конца

### При быстром переключении:
✅ Корректная обработка очереди анимаций
✅ Нет конфликтов состояний
✅ Плавные переходы

## 🧪 Тестирование

### Тест-кейсы для проверки:

1. **Увеличение размера**
```

Шаг 1 (маленький) → Шаг 2 (большой)
Ожидание: Плавное увеличение без скачков

```

2. **Уменьшение размера**
```

Шаг 2 (большой) → Шаг 1 (маленький)
Ожидание: Плавное уменьшение без рывков

```

3. **Быстрое многократное переключение**
```

Быстро нажимать "Далее" → "Назад" → "Далее"
Ожидание: Корректная обработка, без зависаний

```

4. **Переключение с сильно различающимся контентом**
```

Шаг 1 (3 строки) → Шаг 5 (15 строк) → Шаг 1
Ожидание: Плавные переходы в обе стороны

```

5. **Шаг с условным рендерингом**
```

Последний шаг с/без демо-данных
Ожидание: Анимация работает в обоих случаях
⚠️ Потенциальные проблемы и решения
Проблема 1: Задержка при быстром переключении
Симптом: При быстром нажатии кнопок анимация "накладывается"
Решение: Добавить проверку и очистку предыдущих таймеров
jsxconst timeoutRefs = useRef({
fadeOut: null,
height: null,
fadeIn: null,
cleanup: null
});

// В начале useEffect, перед анимацией:
Object.values(timeoutRefs.current).forEach(timeout => {
if (timeout) clearTimeout(timeout);
});
Проблема 2: Скачок при очень быстром переключении
Симптом: Если переключить до завершения предыдущей анимации
Решение: Добавить guard для блокировки быстрых переключений
jsxconst isAnimatingRef = useRef(false);

useEffect(() => {
if (isAnimatingRef.current) {
// Прерываем предыдущую анимацию или игнорируем новую
return;
}

isAnimatingRef.current = true;

// ... вся логика анимации ...

// В конце самого последнего setTimeout:
isAnimatingRef.current = false;
}, [contentKey, children, fadeOutDuration, heightDuration]);
Проблема 3: Мерцание в Safari
Симптом: В Safari может быть видна промежуточная перерисовка
Решение: Добавить will-change и -webkit-backface-visibility
jsxstyle={{
  transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  overflow: shouldHideOverflow ? 'hidden' : 'visible',
  willChange: shouldHideOverflow ? 'height' : 'auto',
  WebkitBackfaceVisibility: 'hidden', // Для Safari
  backfaceVisibility: 'hidden',
}}
📦 Полный финальный код с улучшениями
jsximport { useState, useEffect, useRef } from 'react';

/\*\*

- Wrapper для контента модального окна с анимацией при изменении
-
- ВЕРСИЯ 2.0: Полностью исправленная анимация
- - Корректно работает при увеличении и уменьшении
- - Защита от быстрых переключений
- - Оптимизация для Safari
-
- @param {React.ReactNode} children - Контент для отображения
- @param {string|number} contentKey - Ключ для отслеживания смены контента
- @param {number} fadeOutDuration - Длительность затухания (мс)
- @param {number} heightDuration - Длительность изменения высоты (мс)
  \*/
  export function AnimatedModalContent({
  children,
  contentKey,
  fadeOutDuration = 250,
  heightDuration = 350
  }) {
  const [isChanging, setIsChanging] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(children);
  const [shouldHideOverflow, setShouldHideOverflow] = useState(false);

const contentRef = useRef(null);
const previousKeyRef = useRef(contentKey);
const isAnimatingRef = useRef(false);
const timeoutRefs = useRef({
fadeOut: null,
fadeIn: null,
cleanup: null
});

useEffect(() => {
// Проверяем, изменился ли ключ контента
if (previousKeyRef.current === contentKey) {
setDisplayedContent(children);
return;
}

    const contentElement = contentRef.current;
    if (!contentElement) {
      setDisplayedContent(children);
      previousKeyRef.current = contentKey;
      return;
    }

    // Защита от быстрых переключений
    if (isAnimatingRef.current) {
      // Очищаем предыдущие таймеры
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    }

    isAnimatingRef.current = true;

    // 1. Фиксируем текущую высоту
    const currentHeight = contentElement.getBoundingClientRect().height;
    contentElement.style.height = `${currentHeight}px`;

    // 2. Включаем overflow: hidden
    setShouldHideOverflow(true);

    // 3. Начинаем затухание
    setIsChanging(true);

    // 4. После затухания меняем контент
    timeoutRefs.current.fadeOut = setTimeout(() => {
      setDisplayedContent(children);
      previousKeyRef.current = contentKey;

      // 5. Измеряем новую высоту
      requestAnimationFrame(() => {
        contentElement.style.height = 'auto';
        const newHeight = contentElement.getBoundingClientRect().height;
        contentElement.style.height = `${currentHeight}px`;

        // 6. Анимируем к новой высоте
        requestAnimationFrame(() => {
          contentElement.style.height = `${newHeight}px`;

          // 7. Запускаем fade-in
          timeoutRefs.current.fadeIn = setTimeout(() => {
            setIsChanging(false);

            // 8. Финальная очистка
            timeoutRefs.current.cleanup = setTimeout(() => {
              if (contentElement) {
                contentElement.style.height = 'auto';
                setShouldHideOverflow(false);
                isAnimatingRef.current = false;
              }
            }, heightDuration);
          }, 50);
        });
      });
    }, fadeOutDuration);

    // Cleanup function
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };

}, [contentKey, children, fadeOutDuration, heightDuration]);

return (

<div
ref={contentRef}
className="mb-6"
style={{
        transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        overflow: shouldHideOverflow ? 'hidden' : 'visible',
        willChange: shouldHideOverflow ? 'height' : 'auto',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }} >
<div
className="content-wrapper"
style={{
          transition: `opacity ${fadeOutDuration}ms ease-in-out`,
          opacity: isChanging ? 0 : 1,
          pointerEvents: isChanging ? 'none' : 'auto',
        }} >
{displayedContent}
</div>
</div>
);
}
🎬 Инструкция по внедрению
Шаг 1: Замените файл AnimatedModalContent.jsx
Полностью замените содержимое файла src/components/ui/AnimatedModalContent.jsx на код выше.
Шаг 2: Убедитесь в правильном использовании в TutorialModal
jsx<AnimatedModalContent contentKey={currentStep}>
{currentStepData.content}
</AnimatedModalContent>
Шаг 3: Тестирование

Откройте TutorialModal
Переключайтесь между шагами вперед и назад
Проверьте шаги с разным размером контента
Быстро нажимайте кнопки навигации

Шаг 4: Проверка в разных браузерах

✅ Chrome
✅ Firefox
✅ Safari
✅ Edge

📈 Ожидаемый результат
После внедрения:

✅ Плавная анимация при увеличении размера
✅ Плавная анимация при уменьшении размера
✅ Нет резких рывков или скачков
✅ Корректная работа при быстром переключении
✅ Отсутствие артефактов в Safari

🔧 Дополнительные настройки (опционально)
Изменение скорости анимации:
jsx<AnimatedModalContent
contentKey={currentStep}
fadeOutDuration={200} // Быстрее fade-out
heightDuration={400} // Медленнее изменение высоты

> {currentStepData.content}
> </AnimatedModalContent>
> Отключение анимации для тестирования:
> jsxfadeOutDuration={0}
> heightDuration={0}

Версия: 2.0
Статус: Готово к внедрению
Тестирование: Требуется после внедрения
