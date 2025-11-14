Окей, я посмотрел оба файла. В modal-size-variant-5-fade-smooth.html анимация завязана на чистом JS: она фиксирует текущую высоту контейнера, делает fade-out, меняет контент, а потом плавно тянет высоту до нового scrollHeight. То есть эффект работает, только если ты вручную управляешь высотой через style.height и CSS transition на height.

А в твоём TutorialModal.jsx всё на React и Tailwind, без явного контроля высоты — React просто пересоздаёт содержимое, и браузер мгновенно перестраивает layout. Поэтому «анимация» ломается: у CSS просто нет двух конкретных значений высоты, между которыми можно плавно интерполировать.

Простое, действенное решение без артефактов

Используем framer-motion и AnimatePresence — он умеет анимировать высоту от auto к auto и плавно менять opacity без хака с style.height. Работает стабильно, не конфликтует с HeadlessUI и не требует ручных измерений.

Вот рабочая вставка для твоего TutorialModal.jsx:

import { motion, AnimatePresence } from "framer-motion";

А ниже, вместо твоего блока:

{/_ Контент с плавной анимацией _/}

<div className="mb-6">
  <AnimatePresence mode="wait">
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      layout // плавная анимация изменения размера
    >
      {currentStepData.content}
    </motion.div>
  </AnimatePresence>
</div>

Почему это работает

AnimatePresence следит за появлением и исчезновением элементов (по key), а layout заставляет framer-motion плавно анимировать изменения размеров родителя.

initial/animate/exit дают fade + лёгкое движение, как в твоём HTML-варианте.

Никаких setTimeout, ручного scrollHeight, мерцания или артефактов.

Работает при переключении шагов и при ресайзе модалки (если BaseModal уже использует layout).

Если хочешь точно повторить визуальный стиль fade-smooth

Можно чуть отрегулировать параметры:

transition={{ opacity: { duration: 0.25 }, layout: { duration: 0.35 } }}

Это почти идентично твоей HTML-демке.

Итог: оставляешь всё как есть, просто меняешь содержимое блока контента на этот motion.div. Анимация становится плавной, без дёрганья и костылей.
