// 🎯 JavaScript для варианта 5: Максимально интерактивный

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCounters();
    initTimer();
    initCharts();
    initInteractions();
});

// Частицы фона
function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.closest('.stat-card-animated').classList.contains('counted')) {
                entry.target.closest('.stat-card-animated').classList.add('counted');
                const valueElement = entry.target.querySelector('.stat-value');
                animateCounter(valueElement, parseFloat(entry.target.getAttribute('data-counter')));
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
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
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepDuration);
}

function initTimer() {
    const timerDisplay = document.getElementById('interactive-timer');
    const timerProgress = document.querySelector('.timer-progress-interactive');
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
    
    const playBtn = document.getElementById('interactive-play');
    const stopBtn = document.getElementById('interactive-stop');
    
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
    
    setTimeout(() => {
        startTimer();
        setTimeout(stopTimer, 15000);
    }, 2000);
}

function initCharts() {
    const bars = document.querySelectorAll('.bar-interactive');
    const maxValue = 8500;
    
    bars.forEach((bar, index) => {
        const value = parseInt(bar.getAttribute('data-value'));
        const percentage = (value / maxValue) * 100;
        
        setTimeout(() => {
            bar.style.height = `${percentage}%`;
        }, index * 100);
    });
}

function initInteractions() {
    // Добавляем эффекты при наведении
    document.querySelectorAll('.feature-card-interactive').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-15px) rotateY(5deg) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateY(0) scale(1)';
        });
    });
    
    // Эффект при клике на кнопки
    document.querySelectorAll('.btn-interactive').forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
}

