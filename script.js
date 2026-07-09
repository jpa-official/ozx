/* ============================
   OZX — script.js (v15)
   ============================ */

gsap.registerPlugin(ScrollTrigger);

/* 브라우저 스크롤 복원 비활성화 — 로더 항상 상단에서 시작 */
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* 성능 최적화 */
ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });

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
    '.fp-floor', '.fp-label', '.fp-heading',
    '.hdr-temp', '.hdr-date',
    '.gp-feat-heading', '.gp-title',
].join(', ')).forEach(wrapOZText);

/* ============================
   LENIS SMOOTH SCROLL
   ============================ */
const lenis = new Lenis({
    duration: 1.1,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
    syncTouch: false,
    wheelMultiplier: 0.9,
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
    const pct = scroll / limit * 100;
    progressBar.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
});

/* ============================
   LOADER — DIGIT COUNTER
   ============================ */
const loader     = qs('#loader');
const loaderFill = qs('#loader-fill');
const lcNums     = qsa('.lc-num');

let loadVal    = 0;
let loadDone   = false;
let pageLoaded = false;

function setFill(pct) {
    if (loaderFill) loaderFill.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
}

function digitFlash(finalStr, pct) {
    const flashes = 3;
    for (let i = 0; i < flashes; i++) {
        setTimeout(() => {
            const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
            lcNums.forEach(el => { el.textContent = rand; });
        }, i * 28);
    }
    setTimeout(() => {
        lcNums.forEach(el => { el.textContent = finalStr; });
        if (pct != null) setFill(pct);
    }, flashes * 28 + 10);
}

function exitLoader() {
    lenis.scrollTo(0, { immediate: true, force: true });
    digitFlash('100', 100);
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
    }, 300);
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
    const pct = Math.floor(loadVal);
    setFill(pct);
    digitFlash(String(pct).padStart(2, '0'));
}, 80);

window.addEventListener('load', () => {
    pageLoaded = true;
    if (loadDone) exitLoader();
    /* 모바일에서 autoplay 차단 시 강제 재생
       (gp-feat-bg-video는 아래 IntersectionObserver가 화면 노출 여부에 따라
        재생/정지를 전담하므로 여기서 제외 — 안 그러면 화면 밖 일시정지가 곧바로 덮어써짐.
        gp-video는 iOS Safari에서 스크롤 콜백으로 재생을 재개할 때 poster 이미지에서
        멈추는 경우가 있어 기존 방식(항상 재생) 그대로 유지) */
    qsa('video[autoplay]:not(.gp-feat-bg-video)').forEach(v => {
        v.muted = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        v.play().catch(() => {});
    });
});

/* ============================
   배경 비디오 — 화면에 보일 때만 재생
   (gp-feat-bg-video는 autoplay 속성을 제거해 PC에서 로드/디코딩 자체가
    일어나지 않도록 함 — PC에서는 display:none으로 항상 숨겨진 채 쓰이지
    않는 요소라 로드할 필요가 없음. 모바일 슬라이더에서만 이 observer로
    화면에 보일 때 play, 벗어나면 pause) */
const bgVideoObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
    });
}, { rootMargin: '200px 0px' });

qsa('.gp-feat-bg-video').forEach(v => bgVideoObs.observe(v));

/* iOS: 첫 터치 시 모든 정지된 autoplay 영상 재개
   (gp-feat-bg-video는 화면 노출 여부로 IntersectionObserver가 전담하므로 제외) */
document.addEventListener('touchstart', function resumeVideos() {
    qsa('video[autoplay]:not(.gp-feat-bg-video)').forEach(v => {
        if (v.paused) { v.muted = true; v.play().catch(() => {}); }
    });
    document.removeEventListener('touchstart', resumeVideos);
}, { once: true, passive: true });

/* G-PLANET 히어로 영상 — 화면 밖으로 스크롤되면 디코딩 부하를 줄이기 위해
   일시정지 (다른 핀 섹션 스크롤 중 끊김의 원인이었음). 단, iOS Safari에서
   스크롤/핀 콜백 중 화면에 보이는 상태로 예기치 않게 일시정지되어 poster
   이미지에 멈춰버리는 버그가 있어 — 보이는 동안 정지되면 즉시 재재생 */
const gpVideo = qs('.gp-video');
if (gpVideo) {
    let gpVideoVisible = false;

    new IntersectionObserver(entries => {
        entries.forEach(entry => {
            gpVideoVisible = entry.isIntersecting;
            if (entry.isIntersecting) gpVideo.play().catch(() => {});
            else gpVideo.pause();
        });
    }, { rootMargin: '200px 0px' }).observe(gpVideo);

    gpVideo.addEventListener('pause', () => {
        if (!gpVideoVisible) return;
        gpVideo.muted = true;
        gpVideo.play().catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && gpVideoVisible && gpVideo.paused) {
            gpVideo.muted = true;
            gpVideo.play().catch(() => {});
        }
    });
}

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

const mobileMenu      = qs('#mobile-menu');
const mobileMenuClose = qs('#mobile-menu-close');

function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
}
function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
}

menuToggle.addEventListener('click', () => {
    if (window.innerWidth < 768) {
        mobileMenu.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
    } else {
        navMenu.classList.toggle('open');
    }
});

mobileMenuClose?.addEventListener('click', closeMobileMenu);

qsa('.mobile-nav-a').forEach(a => {
    a.addEventListener('click', closeMobileMenu);
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

    const desc = qs('#id-desc');
    if (desc) desc.classList.add('in');

    idObs.disconnect();
}, { threshold: 0.2 });

const idSection = qs('#identity');
if (idSection) idObs.observe(idSection);

/* Identity 섹션 — 스크롤 핀 (모바일은 짧게)
   진입/이탈 구간에 scrub 페이드+스케일을 걸어 "딱 고정"되는 느낌을 완화 */
(function () {
    const idInner = qs('#identity .id-inner');
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#identity',
            start: 'top top',
            end: window.innerWidth < 768 ? '+=220' : '+=350',
            scrub: 0.6,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
        }
    });
    if (idInner) {
        tl.fromTo(idInner, { opacity: 0.35, y: 28 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' }, 0)
          .to(idInner, { opacity: 1, y: 0, duration: 0.64 }, 0.18)
          .to(idInner, { opacity: 0.35, y: -28, duration: 0.18, ease: 'power1.in' }, 0.82);
    }
})();

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
        return new Promise(resolve => {
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
            this.frame = 0;
            this.resolve = resolve;
            this.update();
        });
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
        if (done < this.queue.length) {
            this.raf = requestAnimationFrame(this.update);
            this.frame++;
        } else if (this.resolve) {
            this.resolve();
            this.resolve = null;
        }
    }
}

/* ============================
   SECTION HEADINGS — SCRAMBLE + CLIP REVEAL
   ============================ */
qsa('.sec-h2').forEach(h2 => {
    const scrambler    = new TextScramble(h2);
    const original     = h2.getAttribute('data-text') || h2.textContent.trim();
    const originalHTML = h2.innerHTML;
    const isMobile     = window.innerWidth < 768;

    /* 모바일: clip-path 숨김 skip (CSS !important로 inline style 못 이김) */
    if (!isMobile) gsap.set(h2, { clipPath: 'inset(0 100% 0 0)' });

    ScrollTrigger.create({
        trigger: h2, start: 'top 88%', once: true,
        onEnter: () => {
            h2.classList.add('in');
            if (!isMobile) {
                gsap.to(h2, {
                    clipPath: 'inset(0 0% 0 0)',
                    duration: 0.9,
                    ease: 'power3.inOut',
                });
                setTimeout(() => scrambler.setText(original).then(() => {
                    h2.innerHTML = originalHTML;
                }), 80);
                setTimeout(() => {
                    h2.classList.add('glitch-active');
                    setTimeout(() => h2.classList.remove('glitch-active'), 220);
                }, 500);
            }
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

    /* ── 모바일: 화살표 클릭으로 카드 전환 ── */
    if (window.innerWidth < 768) {
        const rows = [sr1, sr2, sr3];
        const nSR = rows.length;
        let currentSR = 0;
        let animatingSR = false;
        gsap.set(sr1, { x: '0%' });
        gsap.set(sr2, { x: '100%' });
        gsap.set(sr3, { x: '100%' });
        function goToSR(newIdx) {
            newIdx = ((newIdx % nSR) + nSR) % nSR;
            if (newIdx === currentSR || animatingSR) return;
            animatingSR = true;
            const dir = newIdx > currentSR ? 1 : -1;
            const prev = currentSR;
            currentSR = newIdx;
            gsap.to(rows[prev], { x: (dir * -100) + '%', duration: 0.35, ease: 'power2.inOut' });
            gsap.fromTo(rows[newIdx],
                { x: (dir * 100) + '%' },
                { x: '0%', duration: 0.35, ease: 'power2.inOut',
                  onComplete: () => { animatingSR = false; } }
            );
        }
        const srPrev = qs('.sr-prev');
        const srNext = qs('.sr-next');
        if (srPrev) srPrev.addEventListener('click', () => goToSR(currentSR - 1));
        if (srNext) srNext.addEventListener('click', () => goToSR(currentSR + 1));
        return;
    }

    if (window.innerWidth < 768) {
        return;
    }

    /* MVVS pin-spacer가 먼저 DOM에 삽입된 뒤 #space 위치를 계산해야
       scrub 타임라인의 start/end가 정확해짐 — setTimeout(0)으로 defer */
    setTimeout(() => {
        gsap.set(sr2, { opacity: 0, y: 52 });
        gsap.set(sr3, { opacity: 0, y: 52 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#space',
                start: 'top top',
                end: '+=' + (window.innerHeight * 2.6),
                scrub: 0.5,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
            }
        });

        tl
            .to(sr1, { opacity: 0, y: -52, duration: 0.7, ease: 'power2.inOut' }, 0.7)
            .to(sr2, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.inOut' }, 1.0)
            .to(sr2, { opacity: 0, y: -52, duration: 0.7, ease: 'power2.inOut' }, 2.4)
            .to(sr3, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.inOut' }, 2.7)
            .to({}, { duration: 0.4 });

        /* 아래 세 핀 모두: 진입 18% / 이탈 18% 구간에 scrub 페이드를 걸어
           "빠르게 넘어갔다가 딱 고정"되는 느낌을 없애고, 가운데 구간은
           기존처럼 정지(클릭 탐색 등 기존 기능 유지) */
        const partnersWrap = qs('#partners .sec-wrap');
        const partnersTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#partners', start: 'top top', end: '+=600',
                scrub: 0.6, pin: true, pinSpacing: true, anticipatePin: 1,
            }
        });
        if (partnersWrap) {
            partnersTl
                .fromTo(partnersWrap, { opacity: 0.35, y: 28 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' }, 0)
                .to(partnersWrap, { opacity: 1, y: 0, duration: 0.64 }, 0.18)
                .to(partnersWrap, { opacity: 0.35, y: -28, duration: 0.18, ease: 'power1.in' }, 0.82);
        }

        const gpHero = qs('#gplanet .gp-hero');
        const gplanetTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#gplanet', start: 'top top', end: '+=500',
                scrub: 0.6, pin: true, pinSpacing: true, anticipatePin: 1,
            }
        });
        if (gpHero) {
            gplanetTl
                .fromTo(gpHero, { opacity: 0.35 }, { opacity: 1, duration: 0.18, ease: 'power1.out' }, 0)
                .to(gpHero, { opacity: 1, duration: 0.64 }, 0.18)
                .to(gpHero, { opacity: 0.35, duration: 0.18, ease: 'power1.in' }, 0.82);
        }

        const fpSlider = qs('#fp-slider');
        gsap.timeline({
            scrollTrigger: {
                trigger: '#fp-slider', start: 'top top', end: '+=800',
                scrub: 0.6, pin: true, pinSpacing: true, anticipatePin: 1,
            }
        })
            .fromTo(fpSlider, { opacity: 0.35, y: 28 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' }, 0)
            .to(fpSlider, { opacity: 1, y: 0, duration: 0.64 }, 0.18)
            .to(fpSlider, { opacity: 0.35, y: -28, duration: 0.18, ease: 'power1.in' }, 0.82);
    }, 0);
})();

/* ============================
   PILL CARDS — REVEAL (데스크탑) / 슬라이더 (모바일)
   ============================ */
if (window.innerWidth >= 768) {
    qsa('.pc-reveal').forEach((card, i) => {
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
} else {
    /* 모바일: 화살표 클릭으로 카드 전환 */
    const pillCards = qsa('.pill-card');
    if (pillCards.length >= 2) {
        const nPill = pillCards.length;
        let currentPill = 0;
        let animatingPill = false;
        pillCards.forEach((c, i) => gsap.set(c, { x: i === 0 ? '0%' : '100%', opacity: 1, y: 0, clearProps: 'clipPath' }));
        function goToPill(newIdx) {
            newIdx = ((newIdx % nPill) + nPill) % nPill;
            if (newIdx === currentPill || animatingPill) return;
            animatingPill = true;
            const dir = newIdx > currentPill ? 1 : -1;
            const prev = currentPill;
            currentPill = newIdx;
            gsap.to(pillCards[prev], { x: (dir * -100) + '%', duration: 0.35, ease: 'power2.inOut' });
            gsap.fromTo(pillCards[newIdx],
                { x: (dir * 100) + '%' },
                { x: '0%', duration: 0.35, ease: 'power2.inOut',
                  onComplete: () => { animatingPill = false; } }
            );
        }
        const pillPrev = qs('.pill-prev');
        const pillNext = qs('.pill-next');
        if (pillPrev) pillPrev.addEventListener('click', () => goToPill(currentPill - 1));
        if (pillNext) pillNext.addEventListener('click', () => goToPill(currentPill + 1));
    }
}

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
if (window.innerWidth >= 768) {
    ScrollTrigger.create({
        trigger: '.sr-01', start: 'top 85%', once: true,
        onEnter: () => {
            gsap.fromTo('.sr-01 .sr-title, .sr-01 .sr-num, .sr-01 .sr-ko, .sr-01 .sr-body',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1 }
            );
        }
    });
}

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
   MVVS — 배경 rise + 패널 전환
   ============================ */
(function initMVVS() {
    const tabs   = qsa('.mvvs-tab');
    const panels = qsa('.mvvs-panel');
    if (!tabs.length) return;

    // 초기 상태: 배경 즉시 표시, 콘텐츠 투명
    gsap.set('.mvvs-bg', { clipPath: 'inset(0% 0 0% 0)' });
    gsap.set(tabs,       { opacity: 0 });
    gsap.set(panels,     { opacity: 0, y: 16 });
    tabs[0].classList.add('is-active');
    panels[0].classList.add('is-active');

    /* ── 모바일: 탭 클릭으로 패널 전환 ── */
    if (window.innerWidth < 768) {
        gsap.set('.mvvs-bg', { clipPath: 'inset(0% 0 0% 0)' });
        gsap.set(tabs,   { opacity: 1 });
        gsap.set(panels, { opacity: 0 });
        gsap.set('#panel-mission', { opacity: 1 });

        function switchTab(idx) {
            tabs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
            panels.forEach((p, i) => {
                gsap.to(p, i === idx
                    ? { opacity: 1, duration: 0.25, ease: 'power2.out' }
                    : { opacity: 0, duration: 0.15 });
            });
        }

        tabs.forEach((tab, i) => tab.addEventListener('click', () => switchTab(i)));
        return;
    }

    // 타임라인 총 ~4.5 기준 탭 전환 임계값:
    // MISSION→VISION  at 1.05/4.5 = 0.233
    // VISION→STRATEGY at 2.75/4.5 = 0.611
    // STRATEGY→VALUE  at 3.75/4.5 = 0.833
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#mvvs',
            start: 'top top',
            end: '+=' + (window.innerHeight * 4.0),
            scrub: 0.8,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            onUpdate: (self) => {
                const p = self.progress;
                let idx = 0;
                if      (p >= 0.833) idx = 3;
                else if (p >= 0.611) idx = 2;
                else if (p >= 0.233) idx = 1;
                tabs.forEach((t, i)   => t.classList.toggle('is-active', i === idx));
                panels.forEach((pn, i) => pn.classList.toggle('is-active', i === idx));
            },
        }
    });

    tl
        // Phase 1: 탭 + 첫 패널 등장 (pin 즉시)
        .to(tabs,              { opacity: 1, stagger: 0.08, duration: 0.35 }, 0)
        .to('#panel-mission',  { opacity: 1, y: 0, duration: 0.35 }, 0.25)
        // Phase 2: 패널 전환 MISSION → VISION → STRATEGY → VALUE
        .to('#panel-mission',  { opacity: 0, y: -14, duration: 0.35 }, 1.05)
        .to('#panel-vision',   { opacity: 1, y: 0,   duration: 0.35 }, 1.25)
        .to('#panel-vision',   { opacity: 0, y: -14, duration: 0.35 }, 2.75)
        .to('#panel-strategy', { opacity: 1, y: 0,   duration: 0.35 }, 2.95)
        .to('#panel-strategy', { opacity: 0, y: -14, duration: 0.35 }, 3.75)
        .to('#panel-value',    { opacity: 1, y: 0,   duration: 0.35 }, 3.95)
        .to({}, { duration: 0.2 }); // VALUE에서 잠시 유지

    // 탭 클릭 시 해당 스크롤 위치로 이동 (scrub과 충돌 방지)
    const tabProgress = [0.12, 0.44, 0.74, 0.94];
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            const st = tl.scrollTrigger;
            const target = st.start + tabProgress[i] * (st.end - st.start);
            lenis.scrollTo(target, { duration: 0.8 });
        });
    });
})();

/* ============================
   HEADER BRAND — 클릭 시 히어로 이동
   ============================ */
qs('.header-brand').addEventListener('click', e => {
    e.preventDefault();
    lenis.scrollTo('#hero', { offset: 0, duration: 1.2 });
});

/* 모바일 메뉴 nav — lenis scrollTo */
qsa('.mobile-nav-a').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        closeMobileMenu();
        setTimeout(() => lenis.scrollTo(a.getAttribute('href'), { duration: 1.2 }), 300);
    });
});

/* ============================
   HEADER — DATE / TIME / SEOUL TEMP
   ============================ */
(function initHdrInfo() {
    const dateEl = qs('#hdr-date');
    const timeEl = qs('#hdr-time');
    const tempEl = qs('#hdr-temp');

    const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    function updateClock() {
        const now = new Date();
        const hh  = String(now.getHours()).padStart(2, '0');
        const mm  = String(now.getMinutes()).padStart(2, '0');
        const ss  = String(now.getSeconds()).padStart(2, '0');

        if (window.innerWidth < 768) {
            const yr = now.getFullYear();
            const mo = now.getMonth() + 1;
            const dd = now.getDate();
            if (dateEl) dateEl.textContent = `${yr}.${mo}.${dd}`;
        } else {
            const dd  = String(now.getDate()).padStart(2, '0');
            const mon = MONTHS[now.getMonth()];
            const yr  = now.getFullYear();
            const day = DAYS[now.getDay()];
            if (dateEl) dateEl.textContent = `${day} ${dd} ${mon} ${yr}`;
        }

        if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss} KST`;
    }

    function updateHdrScroll() {
        if (window.innerWidth < 768) {
            const hdrInfo = qs('.hdr-info');
            if (hdrInfo) hdrInfo.style.opacity = window.scrollY > 30 ? '0' : '1';
        }
    }

    window.addEventListener('scroll', updateHdrScroll, { passive: true });

    function fetchTemp() {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m&timezone=Asia%2FSeoul')
            .then(r => r.json())
            .then(data => {
                const t = data?.current?.temperature_2m;
                if (t != null && tempEl) {
                    tempEl.innerHTML = `SE<span class="oz-char">O</span>UL ${Math.round(t)}°C`;
                }
            })
            .catch(() => {});
    }

    updateClock();
    setInterval(updateClock, 1000);

    fetchTemp();
    setInterval(fetchTemp, 600000);
})();

/* ============================
   GP FEATURE — HOVER VIDEO
   ============================ */
(function initFeatVideo() {
    if (window.innerWidth < 768) return; /* 모바일: 슬라이더로 대체 */
    const wrap    = qs('#gp-feat-video-wrap');
    const videoEl = qs('#gp-feat-video');
    const features = qsa('.gp-feature[data-feat-video]');
    if (!wrap || !videoEl) return;

    features.forEach(feat => {
        const src = feat.getAttribute('data-feat-video');

        feat.addEventListener('mouseenter', () => {
            if (!src) return;
            if (videoEl.getAttribute('src') !== src) {
                videoEl.src = src;
                videoEl.load();
            }
            videoEl.play().catch(() => {});
            wrap.classList.add('is-active');
        });

        feat.addEventListener('mouseleave', () => {
            wrap.classList.remove('is-active');
            videoEl.pause();
        });
    });
})();

/* ============================
   G-PLANET HERO — 모바일 핀
   ============================ */
(function initGplanetMobilePin() {
    /* PC/모바일 영상 소스는 <source media> 속성으로 브라우저가 자동 선택하므로
       JS로 다시 로드할 필요 없음 (불필요한 이중 다운로드 방지) */
    if (window.innerWidth >= 768) return;

    /* 모바일: gp-info를 #gplanet 안으로 이동 → 히어로 핀 구간에서 함께 표시 */
    const gpInfo = qs('.gp-info');
    const gplanet = qs('#gplanet');
    if (gpInfo && gplanet) gplanet.appendChild(gpInfo);

    setTimeout(() => {
        let heroSnapCount = 0;
        ScrollTrigger.create({
            trigger: '#gplanet',
            start: 'top top',
            end: '+=600',
            pin: true,
            pinSpacing: true,
            snap: {
                snapTo: v => {
                    if (v <= 0.05) return 0;
                    if (heroSnapCount < 1) { heroSnapCount++; return 0; }
                    return 1;
                },
                duration: { min: 0.3, max: 0.5 },
                ease: 'power1.inOut'
            },
            onEnter: () => { heroSnapCount = 0; },
            onLeaveBack: () => { heroSnapCount = 0; }
        });
    }, 0);
})();

/* 스와이프 → lenis 스냅 이동 헬퍼 (수평·수직 모두 감지)
   window 레벨에서 감지 후 st.isActive 로 해당 섹션 활성 여부 확인 */
function addSwipe(tl, total, step) {
    if (!step) step = 1 / (total - 1);
    let x0 = 0, y0 = 0;
    window.addEventListener('touchstart', e => {
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', e => {
        const st = tl.scrollTrigger;
        if (!st || !st.isActive) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        const isH = Math.abs(dx) > Math.abs(dy);
        const dist = isH ? dx : -dy;   // 좌 또는 위 스와이프 = 다음 카드
        if (Math.abs(dist) < 40) return;
        const cur = Math.min(total - 1, Math.round(st.progress / step));
        const next = Math.max(0, Math.min(total - 1, cur + (dist < 0 ? 1 : -1)));
        if (next === cur) return;
        lenis.scrollTo(st.start + next * step * (st.end - st.start), { duration: 0.5, force: true });
    }, { passive: true });
}

/* 수직 스크롤 스냅 헬퍼: Lenis 모멘텀이 카드를 건너뛰는 문제 수정
   미드포인트를 지나는 순간 lenis.scrollTo(force) 로 1장씩 스냅 */
function addMobileSnap(tl, total, step, onSnap) {
    if (!step) step = 1 / (total - 1);
    const pts = Array.from({ length: total }, (_, i) => i * step);
    let snapIdx = 0;
    let snapping = false;
    lenis.on('scroll', () => {
        const st = tl.scrollTrigger;
        if (!st || !st.isActive || snapping) return;
        const p = st.progress;
        if (snapIdx < total - 1 && p > (pts[snapIdx] + pts[snapIdx + 1]) / 2) {
            snapIdx++;
            snapping = true;
            if (onSnap) onSnap(snapIdx);
            lenis.scrollTo(st.start + pts[snapIdx] * (st.end - st.start), { duration: 0.6, force: true });
            setTimeout(() => { snapping = false; }, 800);
        } else if (snapIdx > 0 && p < (pts[snapIdx - 1] + pts[snapIdx]) / 2) {
            snapIdx--;
            snapping = true;
            if (onSnap) onSnap(snapIdx);
            lenis.scrollTo(st.start + pts[snapIdx] * (st.end - st.start), { duration: 0.6, force: true });
            setTimeout(() => { snapping = false; }, 800);
        }
    });
}

/* ============================
   GP FEATURES — 모바일 가로 슬라이드
   진입 관성이 카드를 건너뛰지 않도록 entryLock 추가
   ============================ */
(function initFeatSlider() {
    if (window.innerWidth >= 768) return;
    const features = qsa('.gp-feature[data-feat-video]');
    if (features.length < 2) return;

    const n = features.length;
    let currentIdx = 0;
    let animating = false;

    features.forEach((f, i) => gsap.set(f, { x: i === 0 ? '0%' : '100%' }));

    function syncVideos(idx) {
        features.forEach((f, i) => {
            const v = f.querySelector('video');
            if (!v) return;
            if (i === idx) { v.muted = true; v.play().catch(() => {}); }
            else { v.pause(); }
        });
    }
    syncVideos(0);

    const dots = qsa('.gp-feat-dot');
    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('is-active', i === currentIdx));
    }

    function goTo(newIdx, dir) {
        if (newIdx === currentIdx || animating) return;
        animating = true;
        const prev = currentIdx;
        currentIdx = newIdx;
        syncVideos(newIdx);
        gsap.to(features[prev], { x: (dir * -100) + '%', duration: 0.35, ease: 'power2.inOut' });
        gsap.fromTo(features[newIdx],
            { x: (dir * 100) + '%' },
            { x: '0%', duration: 0.35, ease: 'power2.inOut',
              onComplete: () => { animating = false; updateDots(); } }
        );
    }

    const prevBtn = qs('.gp-feat-prev');
    const nextBtn = qs('.gp-feat-next');
    if (prevBtn) prevBtn.addEventListener('click', () => goTo((currentIdx - 1 + n) % n, -1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo((currentIdx + 1) % n, 1));
})();

/* ============================
   FLOOR PLAN SLIDER — 무한 루프
   ============================ */
(function initFloorSlider() {
    const track  = qs('#fp-track');
    const prev   = qs('#fp-prev');
    const next   = qs('#fp-next');
    const dotsEl = qs('#fp-dots');
    if (!track) return;

    const slides   = qsa('.fp-slide', track);
    const total    = slides.length;
    // 기본 진입 슬라이드 = 1F
    const startIdx = slides.findIndex(s => s.querySelector('.fp-floor')?.textContent.trim() === '1F');
    let current   = startIdx >= 0 ? startIdx : 0;   // 실제 슬라이드 인덱스 (0~total-1)
    let pos       = current + 1;   // 트랙 내 위치 (클론 포함)
    let animating = false;

    // 앞에 마지막 슬라이드 클론, 뒤에 첫 슬라이드 클론 추가
    // 구조: [clone-7F | B1F | 1F | … | 7F | clone-B1F]
    track.insertBefore(slides[total - 1].cloneNode(true), slides[0]);
    track.appendChild(slides[0].cloneNode(true));

    // 클론 추가 후 초기 위치 (1F가 보이도록 이동)
    track.style.transition = 'none';
    track.style.transform  = `translateX(-${pos * 100}%)`;

    // dots 생성
    slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'fp-dot' + (i === current ? ' is-active' : '');
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.addEventListener('click', () => jumpTo(i));
        dotsEl.appendChild(d);
    });

    function updateDots() {
        qsa('.fp-dot', dotsEl).forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    function move(dir) {
        if (animating) return;
        animating = true;
        pos     += dir;
        current  = ((current + dir) % total + total) % total;
        track.style.transition = '';
        track.style.transform  = `translateX(-${pos * 100}%)`;
        updateDots();
    }

    function jumpTo(idx) {
        if (animating) return;
        const diff = idx - current;
        if (diff === 0) return;
        animating = true;
        pos     += diff;
        current  = idx;
        track.style.transition = '';
        track.style.transform  = `translateX(-${pos * 100}%)`;
        updateDots();
    }

    // 전환 끝 → 클론에서 실제 슬라이드로 순간 이동
    track.addEventListener('transitionend', () => {
        if (pos <= 0) {
            // 7F 클론(pos=0) → 실제 7F(pos=total)로 스냅
            track.style.transition = 'none';
            pos = total;
            track.style.transform = `translateX(-${pos * 100}%)`;
        } else if (pos >= total + 1) {
            // B1F 클론(pos=total+1) → 실제 B1F(pos=1)로 스냅
            track.style.transition = 'none';
            pos = 1;
            track.style.transform = `translateX(-${pos * 100}%)`;
        }
        requestAnimationFrame(() => { animating = false; });
    });

    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(+1));

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  move(-1);
        if (e.key === 'ArrowRight') move(+1);
    });

    let tsX = 0;
    track.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].clientX - tsX;
        if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
    }, { passive: true });
})();


/* ============================
   CONTACT — PIN + BIDIRECTIONAL INFINITE LOOP
   ============================ */
let loopLocked = false;
let currentScroll = 0;

// Lenis scroll 이벤트로 정확한 현재 위치 추적
lenis.on('scroll', ({ scroll }) => {
    currentScroll = scroll;
});

function loopTo(target) {
    if (loopLocked) return;
    loopLocked = true;

    // 오버레이 생성 (없으면)
    let overlay = qs('#loop-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loop-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:499;pointer-events:none;display:none;';
        document.body.appendChild(overlay);
    }

    // 오버레이를 화면 아래에서 올라오며 덮음
    gsap.set(overlay, { display: 'block', yPercent: 100 });
    gsap.to(overlay, {
        yPercent: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
            // 히어로로 즉시 이동 (오버레이 뒤에서)
            lenis.scrollTo(target === '#contact' ? '#contact' : 0, { immediate: true, force: true });
            ScrollTrigger.update();
            // 오버레이 위로 슬라이드해서 히어로 노출
            gsap.to(overlay, {
                yPercent: -100,
                duration: 0.55,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(overlay, { display: 'none' });
                    loopLocked = false;
                }
            });
        }
    });
}

// Contact 핀은 initPtSlider setTimeout 안에서 마지막에 생성 (순서 보장)

// 위 스크롤 → hero 상단에서 의도적으로 많이 올려야 contact로 이동
let upWheelAccum = 0;
let upWheelTimer = null;
window.addEventListener('wheel', e => {
    if (currentScroll > 10) { upWheelAccum = 0; return; }
    if (e.deltaY < 0) {
        upWheelAccum += Math.abs(e.deltaY);
        clearTimeout(upWheelTimer);
        upWheelTimer = setTimeout(() => { upWheelAccum = 0; }, 600);
        if (upWheelAccum >= 600) {
            upWheelAccum = 0;
            loopTo('#contact');
        }
    }
}, { passive: true });

// 터치 지원
let touchStartY = 0;
window.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', e => {
    const swipeDown = e.changedTouches[0].clientY - touchStartY > 80;
    if (currentScroll <= 10 && swipeDown) loopTo('#contact');
}, { passive: true });

/* 모든 핀 생성 완료 후 위치 재계산 */
setTimeout(() => ScrollTrigger.refresh(), 100);
window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 200));

/* ============================
   G-PLANET BGM
   첫 사용자 인터랙션(클릭/터치)으로 오디오 잠금 해제 → 구간 진입 시 1:31부터 재생
   ============================ */
setTimeout(() => {
    const bgm = qs('#gp-bgm');
    if (!bgm) return;
    if (window.innerWidth < 768) return; /* 모바일: BGM 비활성화 (버튼도 CSS에서 숨김) */
    const MAX_VOL = 0.4;

    const FADE = 1.0;
    let fadeTimer = null;
    let userMuted = false;  /* 초기: 자동 재생 — 지플래닛 진입 시 켜짐 */
    let unlocked = false;
    let pendingPlay = false;

    const bgmBtn = qs('#gp-bgm-btn');

    const LOOP_START = 91;   /* 1:31 */
    const LOOP_END   = 122;  /* 2:02 */

    /* 메타데이터 로드 후 시작 시간 고정 */
    bgm.addEventListener('loadedmetadata', () => { bgm.currentTime = LOOP_START; });

    /* 구간 루프: 2:02 도달 시 1:31로 되감기 */
    bgm.addEventListener('timeupdate', () => {
        if (bgm.currentTime >= LOOP_END) {
            bgm.currentTime = LOOP_START;
        }
    });
    /* 오디오가 자연 종료될 경우 루프 보장 */
    bgm.addEventListener('ended', () => {
        bgm.currentTime = LOOP_START;
        if (!userMuted) bgm.play().catch(() => {});
    });

    function updateBtn() {
        if (!bgmBtn) return;
        bgmBtn.classList.toggle('is-muted', userMuted);
        bgmBtn.setAttribute('aria-label', userMuted ? 'BGM 켜기' : 'BGM 끄기');
    }

    if (bgmBtn) {
        bgmBtn.addEventListener('click', () => {
            userMuted = !userMuted;
            updateBtn();
            if (userMuted) {
                fadeTo(0);
            } else {
                bgm.muted = false;
                bgm.volume = 0;
                bgm.play().catch(() => {});
                fadeTo(MAX_VOL);
            }
        });
    }

    function fadeTo(vol) {
        clearInterval(fadeTimer);
        const step = (vol - bgm.volume) / (FADE * 30);
        if (step === 0) return;
        fadeTimer = setInterval(() => {
            const next = bgm.volume + step;
            if ((step > 0 && next >= vol) || (step < 0 && next <= vol)) {
                bgm.volume = Math.max(0, Math.min(1, vol));
                if (vol === 0) bgm.muted = true;
                clearInterval(fadeTimer);
            } else {
                bgm.volume = Math.max(0, Math.min(1, next));
            }
        }, 1000 / 30);
    }

    /* 브라우저 오토플레이 정책: 첫 인터랙션에서 잠금 해제 후 pendingPlay 처리 */
    function unlock() {
        if (unlocked) return;
        unlocked = true;
        if (pendingPlay && !userMuted) {
            bgm.muted = false;
            bgm.volume = 0;
            bgm.play().catch(() => {});
            fadeTo(MAX_VOL);
        } else {
            /* gplanet 진입 전: muted play→pause로 오디오 컨텍스트 잠금 해제
               이후 enterZone()의 play() 호출이 브라우저에서 허용됨 */
            bgm.muted = true;
            bgm.play().then(() => bgm.pause()).catch(() => {});
        }
    }
    ['pointerdown', 'keydown'].forEach(ev =>
        document.addEventListener(ev, unlock, { once: true, capture: true })
    );
    /* wheel(스크롤)도 오디오 컨텍스트 잠금 해제 트리거로 추가 */
    document.addEventListener('wheel', unlock, { once: true, passive: true });

    function enterZone() {
        bgm.currentTime = LOOP_START;
        pendingPlay = true;
        if (!userMuted) {
            if (unlocked) {
                bgm.muted = false;
                bgm.volume = 0;
                bgm.play().catch(() => {});
                fadeTo(MAX_VOL);
            }
            /* 아직 미잠금이면 unlock() 호출 시 자동 재생 */
        }
    }

    /* #gplanet 진입 시 BGM 시작 — 한번 시작되면 계속 재생 */
    ScrollTrigger.create({
        trigger: '#gplanet',
        start: 'top bottom',
        onEnter()     { enterZone(); },
        onEnterBack() {
            if (!userMuted) {
                bgm.muted = false;
                bgm.play().catch(() => {});
                fadeTo(MAX_VOL);
            }
        },
    });
}, 200);

/* ============================
   PARTNER CARDS — SCROLL-DRIVEN HORIZONTAL SLIDER
   ============================ */
(function initPtSlider() {
    const track = qs('#pt-cards');
    if (!track) return;

    const cards = Array.from(qsa('.pt-card', track));
    const total = cards.length; // 3

    /* ── 모바일: 화살표/탭 클릭으로 카드 전환 ── */
    if (window.innerWidth < 768) {
        const mtabs = qsa('.pt-mtab');
        const vw = window.innerWidth;
        let currentIdx = 0;
        let animating = false;

        gsap.set(track, { x: 0 });

        function goTo(idx) {
            const newIdx = (idx + total) % total;
            if (newIdx === currentIdx || animating) return;
            animating = true;
            currentIdx = newIdx;
            mtabs.forEach((t, j) => t.classList.toggle('is-active', j === currentIdx));
            gsap.to(track, {
                x: -currentIdx * vw,
                duration: 0.35,
                ease: 'power2.inOut',
                onComplete: () => { animating = false; }
            });
        }

        const prevBtn = qs('.pt-prev');
        const nextBtn = qs('.pt-next');
        if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIdx + 1));
        mtabs.forEach((tab, i) => tab.addEventListener('click', () => goTo(i)));
        return;
    }

    /* ── 768~900px: 터치 스와이프 ── */
    if (window.innerWidth < 900) {
        track.prepend(cards[total - 1].cloneNode(true));
        track.append(cards[0].cloneNode(true));

        let pos = 1, animating = false;

        function setPos(p, animate) {
            pos = p;
            track.style.transition = animate
                ? 'transform 0.55s cubic-bezier(0.77, 0, 0.18, 1)'
                : 'none';
            track.style.transform = `translateX(-${pos * 100}%)`;
        }

        setPos(1, false);

        track.addEventListener('transitionend', () => {
            if (pos <= 0)              setPos(total, false);
            else if (pos >= total + 1) setPos(1,     false);
            requestAnimationFrame(() => { animating = false; });
        });

        let sx = 0;
        track.addEventListener('touchstart', e => {
            if (!animating) sx = e.touches[0].clientX;
        }, { passive: true });
        track.addEventListener('touchend', e => {
            if (animating) return;
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 50) {
                animating = true;
                setPos(pos + (dx < 0 ? 1 : -1), true);
            }
        }, { passive: true });

        return;
    }

    /* ── 데스크탑: 화살표 클릭 카드 전환 ── */
    const vw = window.innerWidth;
    track.style.transition = 'none';
    let currentIdx = 0;
    let animating  = false;

    gsap.set(track, { x: 0 });

    function goTo(n) {
        const newIdx = (n + total) % total;
        if (newIdx === currentIdx || animating) return;
        animating = true;
        currentIdx = newIdx;
        gsap.to(track, {
            x: -currentIdx * vw,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => { animating = false; }
        });
    }

    const pcPrev = qs('.pt-pc-prev');
    const pcNext = qs('.pt-pc-next');
    if (pcPrev) pcPrev.addEventListener('click', () => goTo(currentIdx - 1));
    if (pcNext) pcNext.addEventListener('click', () => goTo(currentIdx + 1));

    setTimeout(() => {

        /* Contact 핀 — 모든 핀 spacer가 DOM에 추가된 뒤 마지막에 생성해야
           #contact 위치가 정확히 계산됨
           (마지막 섹션이라 이탈 페이드는 없음 — 진입만 scrub로 부드럽게) */
        let contactEntered = false;
        const contactInner = qs('#contact .contact-inner');
        const contactTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#contact',
                start: 'top top',
                end: '+=350',
                scrub: 0.6,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                onEnter: ()     => { contactEntered = true; },
                onEnterBack: () => { contactEntered = true; },
                onLeaveBack: () => { contactEntered = false; },
                onLeave: () => { contactEntered = false; },
            }
        });
        if (contactInner) {
            contactTl
                .fromTo(contactInner, { opacity: 0.35, y: 28 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, 0)
                .to(contactInner, { opacity: 1, y: 0, duration: 0.7 }, 0.3);
        }
    }, 0);
})();
