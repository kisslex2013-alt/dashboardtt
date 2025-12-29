document.addEventListener('DOMContentLoaded', () => {
    // --- Mini Timer Logic ---
    const timerDisplay = document.querySelector('.timer-display');
    const timerBtn = document.getElementById('heroTimerBtn');
    let timerInterval;
    let seconds = 0;
    let isRunning = false;

    function formatTime(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    timerBtn.addEventListener('click', (e) => {
        if (isRunning) {
            clearInterval(timerInterval);
            timerBtn.innerHTML = '<span class="icon-play">▶</span> Фокус';
            timerBtn.style.background = 'var(--accent-blue)';
            isRunning = false;
        } else {
            timerInterval = setInterval(() => {
                seconds++;
                timerDisplay.textContent = formatTime(seconds);
            }, 1000);
            timerBtn.innerHTML = '<span class="icon-pause">⏸</span> Пауза';
            timerBtn.style.background = '#e11d48'; 
            isRunning = true;
            
            // Celebration confetti on start!
            fireConfetti(e.clientX, e.clientY);
        }
    });

    // --- Interactive Task Card (Story Step 1) ---
    const taskCard = document.getElementById('interactive-task-card');
    const taskTitle = taskCard.querySelector('.task-title');
    
    taskCard.addEventListener('click', (e) => {
        if (!taskCard.classList.contains('completed')) {
            taskCard.classList.add('completed');
            taskTitle.textContent = 'Design System (Готово!)';
            fireConfetti(e.clientX, e.clientY);
        } else {
            // Optional: Toggle back
            taskCard.classList.remove('completed');
            taskTitle.textContent = 'Design System';
        }
    });

    // --- Project Switcher (Story Step 2) ---
    const projectSwitcher = document.getElementById('interactive-project-switcher');
    const items = projectSwitcher.querySelectorAll('.project-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            items.forEach(i => i.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');
            
            // Visual feedback: Change border color of container to match project
            const color = item.dataset.color;
            let borderColor = 'rgba(255,255,255,0.1)';
            if(color === 'blue') borderColor = 'var(--accent-blue)';
            if(color === 'purple') borderColor = 'var(--accent-purple)';
            if(color === 'green') borderColor = 'var(--accent-green)';
            
            projectSwitcher.style.borderColor = borderColor;
        });
    });


    // --- Scroll Animations (IntersectionObserver) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.story-step').forEach(step => observer.observe(step));
    document.querySelectorAll('.bento-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card); // You might need to check CSS for .bento-card.in-view if you add fade-in there
    });

    // --- 3D Tilt Effect (Vanilla JS Implementation) ---
    const tiltCards = document.querySelectorAll('.tilt-card, .glass-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Max rotation deg
            const maxRotate = 10;
            
            // Calculate rotation
            const rotateX = ((y - centerY) / centerY) * -maxRotate;
            const rotateY = ((x - centerX) / centerX) * maxRotate;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        });
    });


    // --- Confetti Logic (Simple Canvas) ---
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];

    function fireConfetti(x, y) {
        const particleCount = 100;
        const colors = ['#4f46e5', '#9333ea', '#06b6d4', '#ffffff', '#10b981'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5, // Upward burst
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 5 + 2,
                life: 100
            });
        }
        animateConfetti();
    }

    function animateConfetti() {
        if (particles.length === 0) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life--;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            if (p.life <= 0) {
                particles.splice(index, 1);
            }
        });
        
        requestAnimationFrame(animateConfetti);
    }
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- Parallax Blob ---
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        const blob1 = document.querySelector('.blob-1');
        const blob2 = document.querySelector('.blob-2');
        if(blob1 && blob2) {
            blob1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
            blob2.style.transform = `translate(${-x * 30}px, ${-y * 30}px)`;
        }
    });
});
