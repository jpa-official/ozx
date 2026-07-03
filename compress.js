const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const dir = __dirname;

async function compress() {
    const jobs = [
        // gwanghwa169.jpg - 7.5MB → WebP
        {
            src: 'gwanghwa169.jpg',
            out: 'gwanghwa169.webp',
            opts: { quality: 72 }
        },
        // contact.png
        { src: 'contact.png', out: 'contact.webp', opts: { quality: 80 } },
        // hero images
        { src: 'hero-sub.png', out: 'hero-sub.webp', opts: { quality: 80 } },
        { src: 'hero-sub-2.png', out: 'hero-sub-2.webp', opts: { quality: 80 } },
        // logos
        { src: 'logo-main.png', out: 'logo-main.webp', opts: { quality: 90 } },
        { src: 'logo-wordmark.png', out: 'logo-wordmark.webp', opts: { quality: 90 } },
        { src: 'logo-symbol.png', out: 'logo-symbol.webp', opts: { quality: 90 } },
        { src: 'logo-jpa.png', out: 'logo-jpa.webp', opts: { quality: 90 } },
        { src: 'logo-likeplay.png', out: 'logo-likeplay.webp', opts: { quality: 90 } },
        { src: 'logo-invention-lab.png', out: 'logo-invention-lab.webp', opts: { quality: 90 } },
        // floor plans
        { src: 'B1F.png', out: 'B1F.webp', opts: { quality: 82 } },
        { src: '1F.png', out: '1F.webp', opts: { quality: 82 } },
        { src: '2F.png', out: '2F.webp', opts: { quality: 82 } },
        { src: '3F.png', out: '3F.webp', opts: { quality: 82 } },
        { src: '4F.png', out: '4F.webp', opts: { quality: 82 } },
        { src: '5F.png', out: '5F.webp', opts: { quality: 82 } },
        { src: '6F.png', out: '6F.webp', opts: { quality: 82 } },
        { src: '7F.png', out: '7F.webp', opts: { quality: 82 } },
        { src: 'RF.png', out: 'RF.webp', opts: { quality: 82 } },
        // marquee logos
        { src: 'marquee-upk.png', out: 'marquee-upk.webp', opts: { quality: 80 } },
        { src: 'marquee-artverse.png', out: 'marquee-artverse.webp', opts: { quality: 80 } },
        { src: 'marquee-vers.png', out: 'marquee-vers.webp', opts: { quality: 80 } },
        { src: 'marquee-ba.png', out: 'marquee-ba.webp', opts: { quality: 80 } },
        { src: 'marquee-scf.png', out: 'marquee-scf.webp', opts: { quality: 80 } },
        { src: 'marquee-conteb.png', out: 'marquee-conteb.webp', opts: { quality: 80 } },
        { src: 'marquee-169.png', out: 'marquee-169.webp', opts: { quality: 80 } },
        { src: 'background.jpg', out: 'background.webp', opts: { quality: 78 } },
    ];

    for (const j of jobs) {
        const srcPath = path.join(dir, j.src);
        const outPath = path.join(dir, j.out);
        if (!fs.existsSync(srcPath)) {
            console.log(`SKIP (missing): ${j.src}`);
            continue;
        }
        try {
            const before = fs.statSync(srcPath).size;
            await sharp(srcPath).webp(j.opts).toFile(outPath);
            const after = fs.statSync(outPath).size;
            const pct = Math.round((1 - after / before) * 100);
            console.log(`${j.src} → ${j.out}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${pct}%)`);
        } catch (e) {
            console.error(`ERROR ${j.src}: ${e.message}`);
        }
    }
}

compress().then(() => console.log('\nDone!'));
