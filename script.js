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
    '.mvvs-tab', '.mvvs-col-en',
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

    gsap.fromTo('.menu-toggle', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', delay: 0.25 });
    gsap.fromTo('.header-brand', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.45 });
}

/* ============================
   MENU TOGGLE
   ============================ */
const menuToggle = qs('#menu-toggle');
const navMenu    = qs('#nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
});

qsa('#nav-menu .nav-a').forEach(a => {
    a.addEventListener('click', () => {
        navMenu.classList.remove('open');
    });
});

/* ============================
   HERO — PARALLAX
   ============================ */
gsap.to('#hero-logo-wrap', {
    yPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});




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

/* Identity 섹션 — 스크롤 핀 (한 화면에 머물렀다가 계속) */
ScrollTrigger.create({
    trigger: '#identity',
    start: 'top top',
    end: '+=700',
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
});

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
   SCROLL TEXT REVEAL
   ============================ */

/* Service row 01 — 데스크탑 첫 진입 */
ScrollTrigger.create({
    trigger: '.sr-01', start: 'top 85%', once: true,
    onEnter: () => {
        gsap.fromTo('.sr-01 .sr-title, .sr-01 .sr-num, .sr-01 .sr-ko, .sr-01 .sr-body',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1 }
        );
    }
});

/* Strength lead — 문단별 스태거 */
qsa('.strength-lead p').forEach((p, i) => {
    gsap.fromTo(p,
        { opacity: 0, y: 18 },
        {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power2.out',
            delay: i * 0.13,
            scrollTrigger: { trigger: p, start: 'top 88%', once: true }
        }
    );
});

/* Pill 카드 내부 콘텐츠 스태거 */
qsa('.pill-card').forEach(card => {
    gsap.fromTo(qsa('.pill-label, .pill-ko, .pill-body', card),
        { opacity: 0, y: 14 },
        {
            opacity: 1, y: 0,
            duration: 0.65, ease: 'power2.out',
            stagger: 0.1, delay: 0.25,
            scrollTrigger: { trigger: card, start: 'top 88%', once: true }
        }
    );
});

/* News 텍스트 */
gsap.fromTo('.news-text',
    { opacity: 0, y: 16 },
    {
        opacity: 1, y: 0,
        duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.news-text', start: 'top 88%', once: true }
    }
);

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
   MVVS — MISSION / VISION / STRATEGY / VALUE (스크롤 전환)
   ============================ */
(function initMVVS() {
    const tabs   = qsa('.mvvs-tab');
    const panels = qsa('.mvvs-panel');
    if (!tabs.length) return;

    // 초기 상태
    gsap.set(tabs,             { opacity: 0, y: 20 });
    gsap.set(panels,           { opacity: 0 });
    gsap.set('#panel-mission', { opacity: 1 });
    tabs[0].classList.add('is-active');
    panels[0].classList.add('is-active');

    // 탭 스크롤 진입 시 reveal
    ScrollTrigger.create({
        trigger: '#mvvs', start: 'top 78%', once: true,
        onEnter: () => {
            gsap.to(tabs, {
                opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
            });
        }
    });

    // 핀 + 스크롤 패널 전환
    // 총 타임라인 4.0 기준 탭 전환 임계값:
    // MISSION→VISION: 1.1/4.0 = 0.275
    // VISION→STRATEGY: 2.1/4.0 = 0.525
    // STRATEGY→VALUE: 3.1/4.0 = 0.775
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#mvvs',
            start: 'top top',
            end: '+=' + (window.innerHeight * 3.2),
            scrub: 0.8,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            onUpdate: (self) => {
                const p = self.progress;
                let idx = 0;
                if      (p >= 0.775) idx = 3;
                else if (p >= 0.525) idx = 2;
                else if (p >= 0.275) idx = 1;
                tabs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
                panels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
            },
        }
    });

    tl
        .to('#panel-mission',  { opacity: 0, y: -14, duration: 0.4 }, 0.8)
        .to('#panel-vision',   { opacity: 1, y: 0,   duration: 0.4 }, 1.0)
        .to('#panel-vision',   { opacity: 0, y: -14, duration: 0.4 }, 1.8)
        .to('#panel-strategy', { opacity: 1, y: 0,   duration: 0.4 }, 2.0)
        .to('#panel-strategy', { opacity: 0, y: -14, duration: 0.4 }, 2.8)
        .to('#panel-value',    { opacity: 1, y: 0,   duration: 0.4 }, 3.0)
        .to({}, { duration: 0.6 });
})();

/* ============================
   THEME TOGGLE — 워드마크 클릭
   ============================ */
qs('.header-brand').addEventListener('click', e => {
    e.preventDefault();
    document.body.classList.toggle('burgundy');
});
