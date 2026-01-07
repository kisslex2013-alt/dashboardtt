import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Tv, VenetianBlind, Columns } from 'lucide-react';

/* --- ИСПРАВЛЕННЫЕ АНИМАЦИИ (1-10) --- */

// Общая логика для "оверлейных" анимаций:
// 1. По клику isAnimating = true.
// 2. Появляется оверлей (motion.div) с цветом *новой* темы и анимируется *поверх* *старой* темы.
// 3. по завершении onAnimationComplete:
//    а. Меняется тема (setIsDark).
//    б. isAnimating = false (чтобы AnimatePresence запустил exit-анимацию).
// 4. Оверлей уходит (exit-анимация), открывая под собой *новую* тему.

// 1. Волна снизу вверх (ИСПРАВЛЕНО)
const ThemeTransition1 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-blue-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute inset-0 ${isDark ? 'bg-blue-50' : 'bg-gray-900'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 2. Круг от центра (ИСПРАВЛЕНО)
const ThemeTransition2 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-amber-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isDark ? 'bg-amber-50' : 'bg-slate-900'}`}
            initial={{ scale: 0, width: '1px', height: '1px' }}
            animate={{ scale: 1, width: '300vmax', height: '300vmax' }}
            exit={{ scale: 0, width: '300vmax', height: '300vmax', transition: { duration: 0.4, ease: 'easeIn' } }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 3. Слайд слева направо (ИСПРАВЛЕНО)
const ThemeTransition3 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-indigo-950' : 'bg-sky-100'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute inset-0 ${isDark ? 'bg-sky-100' : 'bg-indigo-950'}`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-indigo-950' : 'bg-indigo-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 4. Fade с масштабированием (Логика корректна, без изменений)
// Эта анимация меняет фон напрямую, что является ее сутью.
const ThemeTransition4 = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <motion.div
      className={`min-h-screen overflow-hidden ${isDark ? 'bg-purple-950' : 'bg-pink-50'}`}
      animate={{
        backgroundColor: isDark ? '#1e1b4b' : '#fdf2f8',
      }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex items-center justify-center min-h-screen"
        >
          <button
            onClick={() => setIsDark(!isDark)}
            className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-purple-950' : 'bg-purple-950 text-white'}`}
          >
            {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
            Переключить тему
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// 5. Диагональный свайп (ИСПРАВЛЕНО)
const ThemeTransition5 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-orange-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute inset-0 ${isDark ? 'bg-orange-50' : 'bg-gray-900'}`}
            initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
            animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            exit={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 6. Множественные круги (ИСПРАВЛЕНО)
// Логика с setTimeout, т.к. onAnimationComplete на группе непредсказуем
const ThemeTransition6 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Общее время = 0.8 (длительность) + 3 * 0.1 (макс. задержка) = 1.1с
    setTimeout(() => {
      setIsDark(!isDark);
      setIsAnimating(false);
    }, 1100);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-cyan-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${isDark ? 'bg-cyan-50' : 'bg-slate-900'}`}
                style={{
                  top: `${25 * (i + 1)}%`,
                  left: `${25 * (i + 1)}%`,
                }}
                initial={{ scale: 0, width: '1px', height: '1px' }}
                animate={{ scale: 1, width: '200vmax', height: '200vmax' }}
                exit={{ scale: 0, transition: { duration: 0.4, delay: i * 0.05 } }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 7. Вертикальные полосы (ИСПРАВЛЕНО)
// Логика с setTimeout
const ThemeTransition7 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Общее время = 0.6 (длительность) + 7 * 0.05 (макс. задержка) = 0.95с
    setTimeout(() => {
      setIsDark(!isDark);
      setIsAnimating(false);
    }, 1000); // 1с для надежности
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-violet-950' : 'bg-yellow-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 flex">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`flex-1 ${isDark ? 'bg-yellow-50' : 'bg-violet-950'}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0, transition: { duration: 0.4, delay: i * 0.05 } }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeInOut' }}
                style={{ originY: i % 2 === 0 ? 'top' : 'bottom' }} // Чередуем направление
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-violet-950' : 'bg-violet-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 8. Вращающийся квадрат (ИСПРАВЛЕНО)
const ThemeTransition8 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-emerald-950' : 'bg-rose-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDark ? 'bg-rose-50' : 'bg-emerald-950'}`}
            initial={{ scale: 0, rotate: 0, width: '1px', height: '1px' }}
            animate={{ scale: 1, rotate: 180, width: '300vmax', height: '300vmax' }}
            exit={{ scale: 0, rotate: 360, transition: { duration: 0.5, ease: 'easeIn' } }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-emerald-950' : 'bg-emerald-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 9. Радиальные волны (ИСПРАВЛЕНО)
// Эта анимация - "эффект". Фон меняется сразу.
const ThemeTransition9 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsDark(!isDark); // Меняем тему сразу
    setIsAnimating(true);
    // Общее время = 1.2 (длительность) + 2 * 0.2 (макс. задержка) = 1.6с
    setTimeout(() => setIsAnimating(false), 1600);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-blue-950' : 'bg-lime-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                // Волны *старого* цвета, исчезающие поверх *нового* фона
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[100px] ${isDark ? 'border-lime-50' : 'border-blue-950'}`}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                // exit не нужен, т.к. isAnimating=false уберет их из DOM
                transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}
                style={{ width: '100vmax', height: '100vmax' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-blue-950' : 'bg-blue-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};

// 10. Пиксельное растворение (ИСПРАВЛЕНО)
// Логика с setTimeout
const ThemeTransition10 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Общее время = 0.4 (длительность) + ~0.4 (макс. задержка) = ~0.8с
    setTimeout(() => {
      setIsDark(!isDark);
      setIsAnimating(false);
    }, 800);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-red-950' : 'bg-teal-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
            {[...Array(96)].map((_, i) => (
              <motion.div
                key={i}
                className={`${isDark ? 'bg-teal-50' : 'bg-red-950'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2, delay: Math.random() * 0.2 } }}
                transition={{
                  duration: 0.4,
                  delay: Math.random() * 0.4,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-red-950' : 'bg-red-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Переключить тему
        </button>
      </div>
    </div>
  );
};


/* --- 5 НОВЫХ ВАРИАНТОВ АНИМАЦИИ --- */

// 11. "Шторы" (Вертикальный разрез)
const ThemeTransition11 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-green-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <>
            <motion.div
              className={`absolute top-0 left-0 w-1/2 h-full ${isDark ? 'bg-green-50' : 'bg-gray-900'}`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <motion.div
              className={`absolute top-0 right-0 w-1/2 h-full ${isDark ? 'bg-green-50' : 'bg-gray-900'}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              onAnimationComplete={() => {
                setIsDark(!isDark);
                setIsAnimating(false);
              }}
            />
          </>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Шторы
        </button>
      </div>
    </div>
  );
};

// 12. "Жалюзи" (Горизонтальные полосы)
const ThemeTransition12 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Общее время = 0.5 + 5 * 0.1 = 1.0с
    setTimeout(() => {
      setIsDark(!isDark);
      setIsAnimating(false);
    }, 1000);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-cyan-950' : 'bg-white'}`}>
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 flex flex-col">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`flex-1 ${isDark ? 'bg-white' : 'bg-cyan-950'}`}
                initial={{ x: i % 2 === 0 ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: i % 2 === 0 ? '-100%' : '100%', transition: { duration: 0.3, delay: i * 0.05 } }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-cyan-950' : 'bg-cyan-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Жалюзи
        </button>
      </div>
    </div>
  );
};

// 13. "TV Выключение"
const ThemeTransition13 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute inset-0 ${isDark ? 'bg-gray-100' : 'bg-black'}`}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 1, transition: { duration: 0.4, ease: 'easeIn' } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ originY: 'center' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={() => { if (!isAnimating) setIsAnimating(true) }}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Tv className="inline mr-2" />}
          TV Выкл
        </button>
      </div>
    </div>
  );
};

// 14. "Двойной Свайп"
const ThemeTransition14 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-pink-950' : 'bg-neutral-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          // Этот div "уходит" (exit), "утаскивая" за собой старый фон
          // Он появляется на 0.5с, чтобы скрыть смену фона, и сразу уходит
          <motion.div
            key="exit-overlay"
            className={`absolute inset-0 ${isDark ? 'bg-pink-950' : 'bg-neutral-50'}`}
            initial={{ y: 0 }}
            animate={{ y: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.6 }}
          />
        )}
        {isAnimating && (
          // Этот div "приходит" (animate), показывая новый фон
          <motion.div
            key="enter-overlay"
            className={`absolute inset-0 ${isDark ? 'bg-neutral-50' : 'bg-pink-950'}`}
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setTimeout(() => setIsAnimating(false), 600); // Даем exit-анимации время
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-pink-950' : 'bg-pink-950 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Moon className="inline mr-2" />}
          Двойной свайп
        </button>
      </div>
    </div>
  );
};

// 15. "Ирис" (Круг из точки клика)
// Немного сложнее, т.к. нужно получить координаты кнопки
const ThemeTransition15 = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const handleToggle = (e) => {
    if (isAnimating || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setClickPos({ x, y });
    setIsAnimating(true);
  };

  // Вычисляем максимальное расстояние до углов экрана
  const maxRadius = Math.max(
    Math.hypot(clickPos.x, clickPos.y),
    Math.hypot(window.innerWidth - clickPos.x, clickPos.y),
    Math.hypot(clickPos.x, window.innerHeight - clickPos.y),
    Math.hypot(window.innerWidth - clickPos.x, window.innerHeight - clickPos.y)
  );

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-stone-900' : 'bg-yellow-50'}`}>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute rounded-full ${isDark ? 'bg-yellow-50' : 'bg-stone-900'}`}
            style={{
              left: clickPos.x,
              top: clickPos.y,
              x: '-50%',
              y: '-50%',
            }}
            initial={{ width: 0, height: 0 }}
            animate={{ 
              width: maxRadius * 2,
              height: maxRadius * 2 
            }}
            exit={{ 
              width: 0,
              height: 0,
              transition: { duration: 0.5, ease: 'easeIn' }
            }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              setIsDark(!isDark);
              setIsAnimating(false);
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={`px-8 py-4 rounded-full font-bold ${isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'}`}
        >
          {isDark ? <Sun className="inline mr-2" /> : <Sparkles className="inline mr-2" />}
          Ирис
        </button>
      </div>
    </div>
  );
};


/* --- КОМПОНЕНТ ДЛЯ ПЕРЕКЛЮЧЕНИЯ --- */

export default function ThemeTransitions() {
  const [current, setCurrent] = useState(0);

  const transitions = [
    { name: '1. Волна (Исправлено)', component: ThemeTransition1 },
    { name: '2. Круг (Исправлено)', component: ThemeTransition2 },
    { name: '3. Слайд (Исправлено)', component: ThemeTransition3 },
    { name: '4. Fade (OK)', component: ThemeTransition4 },
    { name: '5. Диагональ (Исправлено)', component: ThemeTransition5 },
    { name: '6. Мульти-круги (Исправлено)', component: ThemeTransition6 },
    { name: '7. Полосы (Исправлено)', component: ThemeTransition7 },
    { name: '8. Квадрат (Исправлено)', component: ThemeTransition8 },
    { name: '9. Волны (Исправлено)', component: ThemeTransition9 },
    { name: '10. Пиксели (Исправлено)', component: ThemeTransition10 },
    { name: '11. Шторы (Новый)', component: ThemeTransition11 },
    { name: '12. Жалюзи (Новый)', component: ThemeTransition12 },
    { name: '13. TV Выкл (Новый)', component: ThemeTransition13 },
    { name: '14. Двойной свайп (Новый)', component: ThemeTransition14 },
    { name: '15. Ирис (Новый)', component: ThemeTransition15 },
  ];

  const CurrentComponent = transitions[current].component;

  return (
    <div className="relative w-full">
      {/* Оборачиваем в AnimatePresence для плавной смены *самих* компонентов */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CurrentComponent />
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 sm:p-4 w-[95vw] max-w-4xl z-50">
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">{transitions[current].name}</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Нажмите на кнопку для анимации перехода</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          {transitions.map((trans, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                current === idx
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}