// 🎯 JavaScript для промо-страницы - оптимизированная версия

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    initTimer();
    initScrollReveal();
    initParallax();
    initChartSwitcher();
    initEarningsChart();
    initViewSwitcher();
});

// 📊 Анимированные счетчики (оптимизировано)
function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    // Intersection Observer для запуска только при видимости
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-counter'));
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Форматирование
        if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString('ru-RU');
        } else if (target % 1 !== 0) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepDuration);
}

// ⏱️ Таймер демо (улучшенная версия)
function initTimer() {
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    const timerProgress = document.querySelector('.timer-progress');
    const timerHours = document.getElementById('timer-hours');
    const timerEarned = document.getElementById('timer-earned');
    if (!timerDisplay) return;
    
    let seconds = 0;
    let isRunning = false;
    let interval;
    const hourlyRate = 1405; // Средняя ставка
    const totalCircumference = 565; // 2 * PI * 90
    
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const updateProgress = (totalSeconds) => {
        // Обновляем прогресс круга (0-100% за час)
        const progress = (totalSeconds % 3600) / 3600;
        const offset = totalCircumference - (progress * totalCircumference);
        if (timerProgress) {
            timerProgress.style.strokeDashoffset = offset;
        }
        
        // Обновляем часы
        const hours = (totalSeconds / 3600).toFixed(2);
        if (timerHours) {
            timerHours.textContent = hours;
        }
        
        // Обновляем заработок
        const earned = Math.floor(hours * hourlyRate);
        if (timerEarned) {
            timerEarned.textContent = earned.toLocaleString('ru-RU');
        }
    };
    
    const startTimer = () => {
        if (isRunning) return;
        isRunning = true;
        if (timerStatus) {
            timerStatus.textContent = 'активная сессия';
            timerStatus.style.color = '#4ecdc4';
        }
        interval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
            updateProgress(seconds);
        }, 1000);
    };
    
    const stopTimer = () => {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(interval);
        if (timerStatus) {
            timerStatus.textContent = 'остановлен';
            timerStatus.style.color = 'rgba(255,255,255,0.5)';
        }
    };
    
    const resetTimer = () => {
        stopTimer();
        seconds = 0;
        timerDisplay.textContent = '00:00:00';
        if (timerProgress) {
            timerProgress.style.strokeDashoffset = totalCircumference;
        }
        if (timerHours) timerHours.textContent = '0.0';
        if (timerEarned) timerEarned.textContent = '0';
    };
    
    const playBtn = document.getElementById('timer-play');
    const stopBtn = document.getElementById('timer-stop');
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isRunning) {
                stopTimer();
                playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>';
            } else {
                startTimer();
                playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="4" height="12" /><rect x="14" y="6" width="4" height="12" /></svg>';
            }
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', resetTimer);
    }
    
    // Автозапуск через 2 секунды
    setTimeout(() => {
        startTimer();
        setTimeout(stopTimer, 15000);
    }, 2000);
}

// 👁️ Scroll Reveal (оптимизировано)
function initScrollReveal() {
    const banners = document.querySelectorAll('.banner-content');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    banners.forEach(banner => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(50px)';
        banner.style.transition = 'all 0.8s ease';
        observer.observe(banner);
    });
}

// 🎨 Параллакс эффект (оптимизировано)
function initParallax() {
    let ticking = false;
    
    document.addEventListener('mousemove', (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const banners = document.querySelectorAll('.banner');
                banners.forEach((banner, index) => {
                    const rect = banner.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        const x = (e.clientX - window.innerWidth / 2) / (100 + index * 20);
                        const y = (e.clientY - window.innerHeight / 2) / (100 + index * 20);
                        const screenshot = banner.querySelector('.screenshot-wrapper');
                        if (screenshot) {
                            screenshot.style.transform = `rotateY(${-5 + x}deg) rotateX(${2 - y}deg)`;
                        }
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 📊 Переключение типов графиков
function initChartSwitcher() {
    const chartTabs = document.querySelectorAll('.chart-tab');
    const chartSvg = document.getElementById('analytics-chart');
    
    if (!chartSvg || chartTabs.length === 0) return;
    
    // Данные для графика
    const chartData = [
        { day: 'Пн', value: 3500, y: 120 },
        { day: 'Вт', value: 4200, y: 100 },
        { day: 'Ср', value: 5800, y: 70 },
        { day: 'Чт', value: 6200, y: 60 },
        { day: 'Пт', value: 7500, y: 40 }
    ];
    
    const xPositions = [90, 150, 210, 270, 330];
    const maxValue = 8000;
    
    const renderChart = (type) => {
        // Удаляем старые элементы графика
        const oldElements = chartSvg.querySelectorAll('.chart-data');
        oldElements.forEach(el => el.remove());
        
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('class', 'chart-data');
        
        if (type === 'bar') {
            // Столбчатый график
            chartData.forEach((item, index) => {
                const height = 200 - item.y;
                const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bar.setAttribute('x', xPositions[index] - 20);
                bar.setAttribute('y', item.y);
                bar.setAttribute('width', '40');
                bar.setAttribute('height', height.toString());
                bar.setAttribute('fill', '#6366f1');
                bar.setAttribute('rx', '4');
                bar.setAttribute('opacity', '0.9');
                bar.style.animation = `slideUp 0.5s ease ${index * 0.1}s both`;
                chartGroup.appendChild(bar);
            });
        } else if (type === 'line') {
            // Линейный график
            const pathData = chartData.map((item, index) => {
                return `${index === 0 ? 'M' : 'L'} ${xPositions[index]} ${item.y}`;
            }).join(' ');
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', pathData);
            line.setAttribute('stroke', '#6366f1');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('stroke-linejoin', 'round');
            chartGroup.appendChild(line);
            
            // Точки
            chartData.forEach((item, index) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', xPositions[index]);
                circle.setAttribute('cy', item.y);
                circle.setAttribute('r', '6');
                circle.setAttribute('fill', '#6366f1');
                circle.setAttribute('stroke', 'white');
                circle.setAttribute('stroke-width', '2');
                chartGroup.appendChild(circle);
            });
        } else {
            // Областной график
            const pathData = chartData.map((item, index) => {
                return `${index === 0 ? 'M' : 'L'} ${xPositions[index]} ${item.y}`;
            }).join(' ') + ` L 330 200 L 90 200 Z`;
            
            const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            area.setAttribute('d', pathData);
            area.setAttribute('fill', 'url(#gradient1)');
            area.setAttribute('opacity', '0.5');
            chartGroup.appendChild(area);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', chartData.map((item, index) => {
                return `${index === 0 ? 'M' : 'L'} ${xPositions[index]} ${item.y}`;
            }).join(' '));
            line.setAttribute('stroke', '#6366f1');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('fill', 'none');
            chartGroup.appendChild(line);
        }
        
        chartSvg.appendChild(chartGroup);
    };
    
    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chartTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.getAttribute('data-type');
            renderChart(type);
        });
    });
    
    // Инициализация с областью
    renderChart('area');
}

// 📈 Анимация графиков доходов
function initEarningsChart() {
    const barItems = document.querySelectorAll('#weekday-chart .bar-item');
    if (barItems.length === 0) return;
    
    const maxValue = 8500;
    
    barItems.forEach((item, index) => {
        const value = parseInt(item.getAttribute('data-value'));
        const percentage = (value / maxValue) * 100;
        const bar = item.querySelector('.bar');
        const barValue = item.querySelector('.bar-value');
        
        setTimeout(() => {
            bar.style.height = `${percentage}%`;
            bar.style.transition = 'height 0.8s ease';
            if (barValue) {
                barValue.textContent = `${value.toLocaleString('ru-RU')} ₽`;
            }
        }, index * 100);
    });
}

// 👁️ Переключение видов отображения
function initViewSwitcher() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const viewPanels = document.querySelectorAll('.view-panel');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewType = button.getAttribute('data-view');
            
            // Убираем активный класс у всех кнопок
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Скрываем все панели
            viewPanels.forEach(panel => panel.classList.remove('active'));
            
            // Показываем нужную панель
            const targetPanel = document.getElementById(`${viewType}-view`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 🎯 Smooth Scroll для якорных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
