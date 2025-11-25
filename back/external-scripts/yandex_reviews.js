const puppeteer = require('puppeteer-core');

async function run(url) {
    console.log('Запуск быстрого Chromium...');

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        userDataDir: '/tmp/puppeteer-fast',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--disable-default-apps',
            '--disable-notifications',
            '--disable-remote-fonts',
            '--blink-settings=imagesEnabled=false'
        ]
    });

    const page = await browser.newPage();

    // блокируем всё тяжёлое
    await page.setRequestInterception(true);
    page.on('request', req => {
        const type = req.resourceType();

        // блокируем css, фонты, изображения, медиа
        if (['stylesheet', 'font', 'image', 'media'].includes(type)) {
            return req.abort();
        }
        req.continue();
    });

    console.log('Открываем страницу отзывов...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Ждём блок отзывов
    await page.waitForSelector('[class*="business-review-card-view"]', { timeout: 15000 });

    // Пробуем раскрыть кнопку "ещё" если есть
    for (let i = 0; i < 3; i++) {
        const moreBtn = await page.$('button[class*="more"]');
        if (moreBtn) {
            try {
                await moreBtn.click();
                await page.waitForTimeout(300);
            } catch (_) {}
        }
    }

    console.log('Читаем отзывы...');

    const reviews = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('[class*="business-review-card-view"]'))
            .slice(0, 5);

        return nodes.map(node => {
            const author = node.querySelector('[class*="business-review-view__author"]')?.innerText || null;
            const date = node.querySelector('[class*="business-review-view__date"]')?.innerText || null;
            const textBlock = node.querySelector('[class*="business-review-view__comment"]');

            let text = textBlock?.innerText || null;

            // Удаляем кнопку "ещё"
            if (text) text = text.replace(/ещё$/i, '').trim();

            const ratingNode = node.querySelector('[class*="business-rating-badge-view__star"]');
            let rating = null;
            if (ratingNode) {
                const aria = ratingNode.getAttribute('aria-label');
                if (aria) {
                    const match = aria.match(/(\d)/);
                    rating = match ? parseInt(match[1], 10) : null;
                }
            }

            return { author, date, text, rating };
        });
    });

    console.log('Готово.');
    await browser.close();

    return {
        total: reviews.length,
        reviews
    };
}

(async () => {
    const url = process.argv[2];
    if (!url) {
        console.log('Укажите URL страницы отзывов:\nnode yandex_reviews.js "<url>"');
        process.exit(1);
    }

    try {
        const result = await run(url);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Ошибка:', err);
    }
})();
