Техническое задание: Анимация изменения размера модального окна TutorialModal
Проблема
TutorialModal использует BaseModal, который имеет встроенную анимацию resize через ResizeObserver. Однако при смене шагов туториала (каждый шаг имеет разный размер контента) анимация работает нестабильно, с артефактами или вообще не срабатывает.
Анализ причин

1. Конфликт анимаций

BaseModal использует ResizeObserver для отслеживания изменений размера окна браузера
При смене шагов туториала контент меняется мгновенно через React render
ResizeObserver не всегда успевает зафиксировать начальную высоту до изменения

2. Отсутствие контроля над сменой контента

Текущая реализация не управляет процессом смены контента
Нет промежуточного состояния "fade out → change content → fade in"
React рендерит новый контент сразу, минуя плавную анимацию

3. Особенности работы ResizeObserver

Срабатывает ПОСЛЕ изменения размера
Не может зафиксировать размер ДО изменения контента
Не подходит для контролируемых изменений контента

Решение: Двухэтапная анимация с контролируемой сменой контента
Концепция
Используем подход из modal-size-variant-5-fade-smooth.html:

Фаза 1 (Fade Out): Плавное затухание старого контента
Смена контента: Замена содержимого при opacity: 0
Фаза 2 (Height Animation): Плавное изменение высоты под новый контент
Фаза 3 (Fade In): Плавное появление нового контента

Архитектура решения
TutorialModal (управляет логикой смены контента)
↓
BaseModal (предоставляет контейнер и общую структуру)
↓
AnimatedContent (новый wrapper для плавной смены контента)
Техническое решение
Вариант 1: Внедрение в BaseModal (рекомендуется)
Преимущества:

Все модальные окна получат анимацию автоматически
Единая точка управления анимацией
Не требует изменений в TutorialModal

Реализация:
jsx// BaseModal.jsx - добавить состояние для анимации контента
const [isContentChanging, setIsContentChanging] = useState(false);
const [frozenContent, setFrozenContent] = useState(null);
const contentRef = useRef(null);
const previousChildrenRef = useRef(children);

// Эффект для отслеживания смены контента
useEffect(() => {
if (!isOpen) return;

// Проверяем, изменился ли children
if (previousChildrenRef.current !== children) {
const contentElement = contentRef.current;
if (!contentElement) return;

    // Фиксируем текущую высоту и контент
    const currentHeight = contentElement.scrollHeight;
    setFrozenContent(previousChildrenRef.current);
    contentElement.style.height = `${currentHeight}px`;

    // Начинаем затухание
    setIsContentChanging(true);

    setTimeout(() => {
      // Меняем контент (пока opacity: 0)
      setFrozenContent(null);
      previousChildrenRef.current = children;

      // Измеряем новую высоту
      requestAnimationFrame(() => {
        const newHeight = contentElement.scrollHeight;

        // Анимируем высоту
        contentElement.style.height = `${newHeight}px`;

        // Запускаем fade in
        setTimeout(() => {
          setIsContentChanging(false);

          // Возвращаем auto после анимации
          setTimeout(() => {
            contentElement.style.height = 'auto';
          }, 300);
        }, 50);
      });
    }, 250); // Длительность fade out

}
}, [children, isOpen]);
CSS:
css.modal-content {
transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
overflow: hidden;
}

.content-wrapper {
transition: opacity 0.25s ease-in-out;
}

.content-wrapper.fade-out {
opacity: 0;
pointer-events: none;
}

.content-wrapper.fade-in {
opacity: 1;
pointer-events: auto;
}
Проблемы этого подхода:

Сложность определения "смены контента" (children - это React элементы)
Может сработать на любое изменение, даже минорное
Излишняя сложность для BaseModal

Вариант 2: Создание AnimatedModalContent компонента (оптимальный)
Преимущества:

Явный контроль над анимацией
Переиспользуемый компонент
Не усложняет BaseModal
Работает для любого модального окна с динамическим контентом

Создать новый файл: src/components/ui/AnimatedModalContent.jsx
jsximport { useState, useEffect, useRef } from 'react';

/\*\*

- Wrapper для контента модального окна с анимацией при изменении
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

useEffect(() => {
// Проверяем, изменился ли ключ контента
if (previousKeyRef.current === contentKey) {
// Ключ не изменился - просто обновляем контент
setDisplayedContent(children);
return;
}

    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Ключ изменился - запускаем анимацию

    // 1. Фиксируем текущую высоту
    const currentHeight = contentElement.scrollHeight;
    contentElement.style.height = `${currentHeight}px`;

    // 2. Начинаем затухание
    setIsChanging(true);

    // 3. После затухания меняем контент
    setTimeout(() => {
      setDisplayedContent(children);
      previousKeyRef.current = contentKey;

      // 4. Измеряем новую высоту и анимируем
      requestAnimationFrame(() => {
        const newHeight = contentElement.scrollHeight;
        contentElement.style.height = `${newHeight}px`;

        // 5. Запускаем появление
        setTimeout(() => {
          setIsChanging(false);

          // 6. Возвращаем auto после завершения
          setTimeout(() => {
            if (contentElement) {
              contentElement.style.height = 'auto';
            }
          }, heightDuration);
        }, 50);
      });
    }, fadeOutDuration);

}, [contentKey, children, fadeOutDuration, heightDuration]);

return (

<div
ref={contentRef}
className="modal-animated-content"
style={{
        transition: `height ${heightDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        overflow: 'hidden',
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
Использование в TutorialModal.jsx:
jsximport { AnimatedModalContent } from '../ui/AnimatedModalContent';

// В render:
<BaseModal
isOpen={isOpen}
onClose={handleSkip}
title={currentStepData.title}
titleIcon={Icon}
size="large"

> {/_ Индикатор шагов - БЕЗ анимации _/}

  <div className="flex gap-2 mb-6">
    {steps.map((_, index) => (
      <div key={index} className={/* ... */} />
    ))}
  </div>

{/_ Контент С анимацией _/}
<AnimatedModalContent contentKey={currentStep}>
{currentStepData.content}
</AnimatedModalContent>

{/_ Навигация - БЕЗ анимации _/}

  <div className="flex justify-between items-center">
    {/* ... кнопки ... */}
  </div>
</BaseModal>

Вариант 3: Встроенная анимация в TutorialModal (простейший)
Преимущества:

Самый простой
Не требует новых компонентов
Полный контроль внутри одного файла

Реализация:
jsx// TutorialModal.jsx - добавить состояния
const [isContentChanging, setIsContentChanging] = useState(false);
const [displayedStep, setDisplayedStep] = useState(0);
const contentRef = useRef(null);

// Модифицировать handleNext и handlePrevious
const animateStepChange = (newStep) => {
const contentElement = contentRef.current;
if (!contentElement) {
setCurrentStep(newStep);
setDisplayedStep(newStep);
return;
}

// Фиксируем высоту и начинаем затухание
const currentHeight = contentElement.scrollHeight;
contentElement.style.height = `${currentHeight}px`;
setIsContentChanging(true);

setTimeout(() => {
// Меняем шаг
setCurrentStep(newStep);
setDisplayedStep(newStep);

    requestAnimationFrame(() => {
      const newHeight = contentElement.scrollHeight;
      contentElement.style.height = `${newHeight}px`;

      setTimeout(() => {
        setIsContentChanging(false);
        setTimeout(() => {
          contentElement.style.height = 'auto';
        }, 350);
      }, 50);
    });

}, 250);
};

const handleNext = () => {
if (currentStep < steps.length - 1) {
animateStepChange(currentStep + 1);
}
};

const handlePrevious = () => {
if (currentStep > 0) {
animateStepChange(currentStep - 1);
}
};

// В render:

<div 
  ref={contentRef}
  className="mb-6 transition-all duration-300 ease-in-out"
  style={{
    transition: 'height 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden'
  }}
>
  <div 
    style={{
      transition: 'opacity 250ms ease-in-out',
      opacity: isContentChanging ? 0 : 1,
      pointerEvents: isContentChanging ? 'none' : 'auto'
    }}
  >
    {steps[displayedStep].content}
  </div>
</div>

Рекомендация
Используйте Вариант 2 (AnimatedModalContent):

Создайте компонент AnimatedModalContent.jsx
Оберните им контент в TutorialModal
Передайте contentKey={currentStep} для отслеживания смены

Это даст:

✅ Чистый, переиспользуемый код
✅ Плавную анимацию без артефактов
✅ Возможность использовать в других модальных окнах
✅ Не усложняет BaseModal

Тестирование
После внедрения проверьте:

Переключение между шагами вперед/назад
Быстрое многократное нажатие кнопок
Шаги с сильно различающимся размером контента
Шаг с демо-данными (условный рендеринг)

Альтернативное решение: Отключить анимацию в BaseModal для TutorialModal
Если анимация не критична, можно:

Добавить проп disableContentAnimation в BaseModal
Передать его из TutorialModal
Оставить только базовые CSS transitions

Это упростит код, но потеряется плавность UI.
