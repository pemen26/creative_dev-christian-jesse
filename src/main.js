import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let mouse = { x: 0, y: 0 };
let audioContextStarted = false;
let isResetting = false;

window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        handleParallax();
    });

    const unlockAudio = () => {
        if (!audioContextStarted) {
            audioContextStarted = true;
            checkCurrentSection();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('wheel', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('wheel', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    initCanvas();
    initScrollAndAudio();
});

function initCanvas() {
    const canvas = document.getElementById('joy-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * w;
            this.y = h + 20;
            this.s = 0.8 + Math.random() * 2;
            this.r = 2 + Math.random() * 4;
            this.a = Math.random() * 0.5;
        }
        update() {
            this.y -= this.s;
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x -= dx * 0.05;
                this.y -= dy * 0.05;
            }
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.a})`;
            ctx.fill();
        }
    }

    for(let i=0; i<60; i++) particles.push(new P());

    function render() {
        ctx.clearRect(0,0,w,h);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(render);
    }
    render();
}

function handleParallax() {
    const titles = document.querySelectorAll('h1');
    const xRatio = (mouse.x / window.innerWidth - 0.5) * 2;
    const yRatio = (mouse.y / window.innerHeight - 0.5) * 2;
    titles.forEach(title => {
        gsap.to(title, { x: -35 * xRatio, y: -35 * yRatio, duration: 0.8, ease: "power2.out" });
    });
}

function checkCurrentSection() {
    if (isResetting) return; 
    const sections = document.querySelectorAll('.emotion-section');
    sections.forEach((section, i) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight/2 && rect.bottom >= window.innerHeight/2) {
            updateMood(i, section.getAttribute('data-color'));
        }
    });
}

function initScrollAndAudio() {
    const sections = document.querySelectorAll('.emotion-section');
    
    sections.forEach((section, i) => {
        ScrollTrigger.create({
            trigger: section,
            start: "top center",
            onEnter: () => { if(!isResetting) updateMood(i, section.getAttribute('data-color')) },
            onEnterBack: () => { if(!isResetting) updateMood(i, section.getAttribute('data-color')) }
        });
    });

    const restartBtn = document.querySelector('.restart-btn');
    if (restartBtn) {
        restartBtn.onclick = () => {
            isResetting = true;
        
            window.scrollTo({top: 0, behavior: 'smooth'});
    
            updateMood(0, "#FFB000");
 
            setTimeout(() => {
                isResetting = false;
            }, 1000);
        };
    }
}

function updateMood(index, color) {
    const images = document.querySelectorAll('.bg-image');
    const overlay = document.querySelector('.color-overlay');
    
    images.forEach((img, idx) => img.classList.toggle('active', idx === index));
    gsap.to(overlay, { backgroundColor: color, duration: 1.5, ease: "power1.inOut" });
    
    if (audioContextStarted) {
        playSound(index);
    }
}

function playSound(index) {
    const audios = [
        document.getElementById('audio-joie'),
        document.getElementById('audio-embarras'),
        document.getElementById('audio-colere')
    ];

    audios.forEach((audio, i) => {
        if (!audio) return;
        
        if (i === index) {
            audio.play().catch(() => {});
            gsap.to(audio, { volume: 1, duration: 1 });
        } else {
            
            gsap.to(audio, { 
                volume: 0, 
                duration: 0.5, 
                onComplete: () => {
                    if (audio.volume === 0) audio.pause();
                } 
            });
        }
    });
}