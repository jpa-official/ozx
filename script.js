/* ============================
   OZX — script.js (v5)
   ============================ */

gsap.registerPlugin(ScrollTrigger);

const lerp   = (a, b, t) => a + (b - a) * t;
const clamp  = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const qs     = (sel, ctx = document) => ctx.querySelector(sel);
const qsa    = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================
   O / Z — XWIDE SWAP
   텍스트 노드를 순회하며 O·Z를 .oz-char 스팬으로 감쌈
   ============================ */
function wrapOZText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        if (!/[OZ]/.test(node.textContent)) return;
        const frag = document.createDocumentFragment();
        node.textContent.split(/([OZ])/).forEach(part => {
            if (part === 'O' || part === 'Z') {
                const s = document.createElement('span');
                s.className = 'oz-char';
                s.textContent = part;
                frag.appendChild(s);
            } else if (part) {
                frag.appendChild(document.createTextNode(part));
            }
        });
        node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        [...node.childNodes].forEach(wrapOZText);
    }
}

qsa([
    '.header-brand', '.nav-a', '.id-tagline', '.sr-title',
    '.scroll-cue span',
    '.f-logo', '.f-tagline', '.f-nav a',
    '.pill-label', '.news-text',
].join(', ')).forEach(wrapOZText);

/* ============================
   LENIS SMOOTH SCROLL
   ============================ */
const lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
});

gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);


/* ============================
   SCROLL PROGRESS BAR
   ============================ */
const progressTrack = document.createElement('div');
progressTrack.id = 'progress-track';
document.body.prepend(progressTrack);

const progressBar = document.createElement('div');
progressBar.id = 'progress-bar';
document.body.prepend(progressBar);

lenis.on('scroll', ({ scroll, limit }) => {
    progressBar.style.width = (scroll / limit * 100) + '%';
});

/* ============================
   LOADER — DIGIT COUNTER
   ============================ */
const loader  = qs('#loader');
const lcNum   = qs('.lc-num');
const DIGITS  = '0123456789';

let loadVal    = 0;
let loadDone   = false;
let pageLoaded = false;

/* Brief random digit flash */
function digitFlash(finalStr) {
    const flashes = 3;
    for (let i = 0; i < flashes; i++) {
        setTimeout(() => {
            lcNum.textContent = String(
                Math.floor(Math.random() * 100)
            ).padStart(2, '0');
        }, i * 28);
    }
    setTimeout(() => {
        lcNum.textContent = finalStr;
    }, flashes * 28 + 10);
}

function exitLoader() {
    digitFlash('100');
    setTimeout(() => {
        gsap.to(loader, {
            yPercent: -100,
            duration: 1.1,
            ease: 'power3.inOut',
            onComplete: () => {
                loader.style.display = 'none';
                startHero();
            }
        });
    }, 80);
}

const loadTick = setInterval(() => {
    loadVal += Math.random() * 5 + 2;
    if (loadVal >= 100) {
        loadVal = 100;
        clearInterval(loadTick);
        if (pageLoaded) exitLoader();
        loadDone = true;
        return;
    }
    digitFlash(String(Math.floor(loadVal)).padStart(2, '0'));
}, 80);

window.addEventListener('load', () => {
    pageLoaded = true;
    if (loadDone) exitLoader();
});

/* ============================
   CHARACTER SPLIT HELPER
   ============================ */
function charSplit(el) {
    const text = el.textContent;
    el.innerHTML = text.split('').map(c =>
        `<span class="char-w"><span class="char-i${ /[OZ]/.test(c) ? ' oz-char' : '' }">${
            c === ' ' ? ' ' : c
        }</span></span>`
    ).join('');
    return el.querySelectorAll('.char-i');
}

function revealChars(el, delay = 0, stagger = 0.03) {
    const chars = charSplit(el);
    gsap.set(chars, { yPercent: 110 });
    return gsap.to(chars, {
        yPercent: 0,
        duration: 0.75,
        stagger,
        ease: 'power3.out',
        delay,
    });
}

/* ============================
   HERO ENTRANCE
   ============================ */
function startHero() {
    const wrap = qs('#hero-logo-wrap');

    const cue  = qs('.scroll-cue');

    gsap.set(wrap, { opacity: 0, scale: 0.92 });

    const tl = gsap.timeline();
    tl.to(wrap, { opacity: 1, scale: 1, duration: 1.3, ease: 'power3.out' });


    tl.to(cue, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');

    gsap.fromTo('.logo-mark',  { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', delay: 0.25 });
    gsap.fromTo('.header-brand', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.45 });
    gsap.from('.nav-a',        { opacity: 0, x:  16, stagger: 0.08, duration: 0.65, ease: 'power2.out', delay: 0.3 });
}

/* ============================
   PARTICLE SYSTEM — HERO
   ============================ */
(function initParticles() {
    const canvas = qs('#hero-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H, particles = [];
    const MOUSE = { x: null, y: null };

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makePt() {
        return {
            x: Math.random() * W, y: Math.random() * H,
            bvx: (Math.random() - 0.5) * 0.35,
            bvy: (Math.random() - 0.5) * 0.35,
            vx: 0, vy: 0,
            r: Math.random() * 2.2 + 0.9,
            a: Math.random() * 0.45 + 0.1,
        };
    }

    function init() {
        const N = clamp(Math.floor(W * H / 11000), 60, 140);
        particles = Array.from({ length: N }, makePt);
        particles.forEach(p => { p.vx = p.bvx; p.vy = p.bvy; });
    }

    function tick() {
        ctx.clearRect(0, 0, W, H);
        const fg = document.body.classList.contains('burgundy') ? '0,0,0' : '255,255,255';

        particles.forEach(p => {
            if (MOUSE.x !== null) {
                const dx = p.x - MOUSE.x, dy = p.y - MOUSE.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160 && dist > 0) {
                    const f = (160 - dist) / 160 * 0.9;
                    p.vx += dx / dist * f; p.vy += dy / dist * f;
                }
            }
            p.vx = lerp(p.vx, p.bvx, 0.04);
            p.vy = lerp(p.vy, p.bvy, 0.04);
            const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (sp > 4) { p.vx = p.vx / sp * 4; p.vy = p.vy / sp * 4; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
            if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 10000) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${fg},${(1 - Math.sqrt(d2)/100) * 0.12})`;
                    ctx.lineWidth = 0.4; ctx.stroke();
                }
            }
        }

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${fg},${p.a})`;
            ctx.fill();
        });

        requestAnimationFrame(tick);
    }

    resize(); init(); tick();
    window.addEventListener('resize', () => { resize(); init(); });
    window.addEventListener('mousemove', e => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; });
})();

/* ============================
   HERO — PARALLAX
   ============================ */
gsap.to('#hero-logo-wrap', {
    yPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});
gsap.to('.hero-sub-wrap', {
    yPercent: -10, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '60% top', scrub: true }
});


/* ============================
   CUSTOM CURSOR — 심볼 이미지
   ============================ */
(function initCursor() {
    const cursor = qs('#c-cursor');
    let mx = 0, my = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    function animCursor() {
        cx = lerp(cx, mx, 0.18);
        cy = lerp(cy, my, 0.18);
        cursor.style.left = cx + 'px';
        cursor.style.top  = cy + 'px';
        requestAnimationFrame(animCursor);
    }
    requestAnimationFrame(animCursor);
})();


/* ============================
   IDENTITY — LOGO + DESC REVEAL
   ============================ */
const idObs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;

    const block = qs('#id-title-block');
    if (block) block.classList.add('in');

    setTimeout(() => {
        const desc = qs('#id-desc');
        if (desc) desc.classList.add('in');
    }, 500);

    idObs.disconnect();
}, { threshold: 0.2 });

const idSection = qs('#identity');
if (idSection) idObs.observe(idSection);

/* ============================
   TEXT SCRAMBLE CLASS
   ============================ */
class TextScramble {
    constructor(el) {
        this.el    = el;
        this.chars = '!<>_\\/[]{}=+*^?#—·@$%';
        this.frame = 0; this.queue = [];
        this.update = this.update.bind(this);
    }
    setText(text) {
        const old = this.el.innerText;
        const len = Math.max(old.length, text.length);
        this.queue = [];
        for (let i = 0; i < len; i++) {
            const from = old[i] || '', to = text[i] || '';
            const start = Math.floor(Math.random() * 14);
            const end   = start + Math.floor(Math.random() * 14) + 6;
            this.queue.push({ from, to, start, end, char: '' });
        }
        cancelAnimationFrame(this.raf);
        this.frame = 0; this.update();
    }
    update() {
        let out = '', done = 0;
        for (let i = 0; i < this.queue.length; i++) {
            const { from, to, start, end } = this.queue[i];
            if (this.frame >= end) { done++; out += /[OZ]/.test(to) ? `<span class="oz-char">${to}</span>` : to; }
            else if (this.frame >= start) {
                if (Math.random() < 0.3) this.queue[i].char = this.chars[Math.floor(Math.random() * this.chars.length)];
                out += `<span style="opacity:.45">${this.queue[i].char || from}</span>`;
            } else { out += from; }
        }
        this.el.innerHTML = out;
        if (done < this.queue.length) { this.raf = requestAnimationFrame(this.update); this.frame++; }
    }
}

/* ============================
   SECTION HEADINGS — SCRAMBLE + CLIP REVEAL
   ============================ */
qsa('.sec-h2').forEach(h2 => {
    const scrambler = new TextScramble(h2);
    const original  = h2.getAttribute('data-text') || h2.textContent.trim();

    /* Clip-path wipe: text revealed left→right */
    gsap.set(h2, { clipPath: 'inset(0 100% 0 0)' });

    ScrollTrigger.create({
        trigger: h2, start: 'top 88%', once: true,
        onEnter: () => {
            h2.classList.add('in');
            /* Clip-path wipe */
            gsap.to(h2, {
                clipPath: 'inset(0 0% 0 0)',
                duration: 0.9,
                ease: 'power3.inOut',
            });
            /* Scramble text after wipe reveals it */
            setTimeout(() => scrambler.setText(original), 80);
            /* Glitch flash */
            setTimeout(() => {
                h2.classList.add('glitch-active');
                setTimeout(() => h2.classList.remove('glitch-active'), 220);
            }, 500);
        }
    });
});

/* ============================
   FADE-UP ELEMENTS
   ============================ */
qsa('.fade-up').forEach((el, i) => {
    ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => setTimeout(() => el.classList.add('in'), i * 120)
    });
});

/* ============================
   WHAT WE DO — STICKY SCROLL
   (01 → 02 → 03 on scroll)
   ============================ */
(function initServiceScroll() {
    const sr1 = qs('.sr-01');
    const sr2 = qs('.sr-02');
    const sr3 = qs('.sr-03');
    if (!sr1 || !sr2 || !sr3) return;

    if (window.innerWidth < 900) {
        [sr1, sr2, sr3].forEach((row, i) => {
            row.style.gridArea = 'unset';
            gsap.set(row, { opacity: 0, y: 40 });
            ScrollTrigger.create({
                trigger: row, start: 'top 85%', once: true,
                onEnter: () => gsap.to(row, {
                    opacity: 1, y: 0, duration: 0.8,
                    delay: i * 0.08, ease: 'power2.out'
                })
            });
        });
        return;
    }

    gsap.set(sr2, { opacity: 0, y: 52 });
    gsap.set(sr3, { opacity: 0, y: 52 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#space',
            start: 'top top',
            end: '+=' + (window.innerHeight * 2.6),
            scrub: 0.9,
            pin: true,
            anticipatePin: 1,
        }
    });

    tl
        .to(sr1, { opacity: 0, y: -52, duration: 0.7, ease: 'power2.inOut' }, 0.7)
        .to(sr2, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.inOut' }, 1.0)
        .to(sr2, { opacity: 0, y: -52, duration: 0.7, ease: 'power2.inOut' }, 2.4)
        .to(sr3, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.inOut' }, 2.7)
        .to({}, { duration: 0.4 });
})();

/* ============================
   PILL CARDS — REVEAL
   ============================ */
qsa('.pc-reveal').forEach((card, i) => {
    /* Clip-path wipe from bottom */
    gsap.set(card, { clipPath: 'inset(100% 0 0 0)' });
    ScrollTrigger.create({
        trigger: card, start: 'top 90%', once: true,
        onEnter: () => gsap.to(card, {
            clipPath: 'inset(0% 0 0 0)',
            opacity: 1, y: 0,
            duration: 0.85,
            delay: i * 0.18,
            ease: 'power3.out',
        })
    });
});

/* ============================
   MARQUEE — HOVER PAUSE
   ============================ */
const marqueeWrap  = qs('.marquee-wrap');
const marqueeTrack = qs('.marquee-track');
marqueeWrap.addEventListener('mouseenter', () => { marqueeTrack.style.animationPlayState = 'paused'; });
marqueeWrap.addEventListener('mouseleave', () => { marqueeTrack.style.animationPlayState = 'running'; });

/* ============================
   MAGNETIC NAV
   ============================ */
qsa('.nav-a, .f-nav a').forEach(link => {
    link.addEventListener('mousemove', e => {
        const r = link.getBoundingClientRect();
        link.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.25}px, ${(e.clientY - r.top - r.height/2) * 0.4}px)`;
    });
    link.addEventListener('mouseleave', () => link.style.transform = 'translate(0,0)');
});

/* ============================
   FOOTER REVEAL
   ============================ */
ScrollTrigger.create({
    trigger: 'footer', start: 'top 85%', once: true,
    onEnter: () => {
        gsap.from('.f-logo',  { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out' });
        gsap.from('.f-tagline, .f-nav a, .f-bot', {
            opacity: 0, y: 14, stagger: 0.09, duration: 0.7, ease: 'power2.out', delay: 0.15
        });
    }
});

/* ============================
   HERO CANVAS — FADE ON SCROLL
   ============================ */
ScrollTrigger.create({
    trigger: '#hero', start: 'bottom top',
    onEnter:     () => { const c = qs('#hero-canvas'); c.style.transition = 'opacity .6s'; c.style.opacity = '0'; },
    onLeaveBack: () => { qs('#hero-canvas').style.opacity = '1'; }
});

/* ============================
   THEME TOGGLE — 워드마크 클릭
   ============================ */
qs('.header-brand').addEventListener('click', e => {
    e.preventDefault();
    document.body.classList.toggle('burgundy');
});
