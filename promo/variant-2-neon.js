// 🎯 JavaScript для варианта 2: Неоновый стиль

document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    initTimer();
    initCharts();
});

function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
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
        
        if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString('ru-RU');
        } else if (target % 1 !== 0) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepDuration);
}

function initTimer() {
    const timerDisplay = document.getElementById('neon-timer');
    const timerProgress = document.querySelector('.timer-progress');
    if (!timerDisplay) return;
    
    let seconds = 0;
    let isRunning = false;
    let interval;
    const totalCircumference = 565;
    
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const startTimer = () => {
        if (isRunning) return;
        isRunning = true;
        interval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
            
            // Обновляем прогресс
            const progress = (seconds % 3600) / 3600;
            const offset = totalCircumference - (progress * totalCircumference);
            if (timerProgress) {
                timerProgress.style.strokeDashoffset = offset;
            }
        }, 1000);
    };
    
    const stopTimer = () => {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(interval);
    };
    
    const resetTimer = () => {
        stopTimer();
        seconds = 0;
        timerDisplay.textContent = '00:00:00';
        if (timerProgress) {
            timerProgress.style.strokeDashoffset = totalCircumference;
        }
    };
    
    const playBtn = document.getElementById('neon-play');
    const stopBtn = document.getElementById('neon-stop');
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isRunning) {
                stopTimer();
                playBtn.textContent = '▶';
            } else {
                startTimer();
                playBtn.textContent = '⏸';
            }
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', resetTimer);
    }
    
    // Автозапуск
    setTimeout(() => {
        startTimer();
        setTimeout(stopTimer, 15000);
    }, 2000);
}

function initCharts() {
    const bars = document.querySelectorAll('.neon-bar');
    const maxValue = 8500;
    
    bars.forEach((bar, index) => {
        const value = parseInt(bar.getAttribute('data-value'));
        const percentage = (value / maxValue) * 100;
        
        setTimeout(() => {
            bar.style.height = `${percentage}%`;
        }, index * 100);
    });
}

