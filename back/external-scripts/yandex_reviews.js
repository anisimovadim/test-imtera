const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// const chromiumPath = '/usr/bin/chromium-browser'; // для Ubuntu
const chromiumPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(chromiumPath)) {
    console.error("Chromium не найден по пути /usr/bin/chromium-browser");
    console.error("Проверь: apt install chromium-browser");
    process.exit(1);
}

const url = process.argv[2];
if (!url) {
    console.error("URL не передан");
    process.exit(1);
}

const allowed = /^[0-9A-Za-zА-Яа-яЁё .,!?\-:;"'()—…]+$/;

function emojiToHtml(str) {
    if (!str) return str;
    if (allowed.test(str)) return str;
    return Array.from(str)
        .map(ch => allowed.test(ch) ? ch : `&#${ch.codePointAt(0)};`)
        .join('');
}

function safeText(str) {
    if (!str) return null;
    return Buffer.from(str, 'utf8').toString();
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: chromiumPath,
            headless: true,
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-networking',
                '--disable-gpu',
                '--no-first-run',
                '--disable-features=TranslateUI',
                '--disable-extensions',
                '--dns-prefetch-disable',
                '--disable-sync',
                '--hide-scrollbars',
                '--disable-webgl',
                '--disable-webgl2',
                '--disable-notifications',
                '--disable-popup-blocking'
            ]
        });

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

        // Максимальное ускорение: отключаем тяжелые ресурсы
        await page.setRequestInterception(true);
        page.on('request', req => {
            const type = req.resourceType();
            const url = req.url();

            if (
                type === 'image' ||
                type === 'stylesheet' ||
                type === 'font' ||
                type === 'media' ||
                type === 'websocket' ||
                type === 'eventsource' ||
                url.includes('mc.yandex') ||
                url.includes('advert')
            ) {
                return req.abort();
            }

            req.continue();
        });

        await page.setUserAgent(
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        // Дожидаемся рендеринга заголовка
        await page.waitForSelector('.orgpage-header-view__header', { timeout: 30000 })
            .catch(() => {});

        const filial_name = await page.$eval(
            '.orgpage-header-view__header',
            el => el.innerText.trim(),
        ).catch(() => null);

        const filial_clean = safeText(emojiToHtml(filial_name));

        // Кол-во отзывов
        const total_reviews_raw = await page.$eval(
            '.business-rating-amount-view._summary',
            el => el.innerText,
        ).catch(() => null);

        const total_reviews = total_reviews_raw
            ? total_reviews_raw.replace(/\D/g, '')
            : null;

        // Средний рейтинг
        const avg_parts = await page.$$eval(
            '.business-summary-rating-badge-view__rating-text',
            nodes => nodes.map(n => n.textContent.trim()).filter(Boolean)
        ).catch(() => []);

        let average_rating = null;
        if (avg_parts.length >= 3) {
            average_rating = parseFloat(`${avg_parts[0]}.${avg_parts[2]}`);
        }

        // Загружаем отзывы
        await page.waitForSelector('.business-review-view', { timeout: 20000 })
            .catch(() => {});

        const reviewNodes = await page.$$('.business-review-view');
        const first10 = reviewNodes.slice(0, 10);

        // Раскрытие длинных отзывов
        for (const node of first10) {
            const expand = await node.$('.business-review-view__expand');
            if (expand) {
                await expand.click().catch(() => {});
                await sleep(50);
            }
        }

        const reviews = [];
        for (const node of first10) {
            const review = await page.evaluate(el => {
                const q = (sel, attr = 'innerText') => {
                    const n = el.querySelector(sel);
                    if (!n) return null;
                    return attr === 'innerText'
                        ? n.innerText.trim()
                        : n.getAttribute(attr);
                };

                const author = q('.business-review-view__author-name span[itemprop="name"]');
                const rating = q('[itemprop="reviewRating"] meta[itemprop="ratingValue"]', 'content');
                const isoDate = q('.business-review-view__date meta[itemprop="datePublished"]', 'content');

                let date = null;
                if (isoDate) {
                    const d = new Date(isoDate);
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    date = `${dd}.${mm}.${yyyy}`;
                }

                const text = q('.spoiler-view__text-container');

                return { author, rating, date, text };
            }, node);

            reviews.push({
                author: safeText(emojiToHtml(review.author)),
                rating: review.rating ? parseFloat(review.rating) : null,
                date: review.date,
                text: safeText(emojiToHtml(review.text))
            });
        }

        console.log(JSON.stringify({
            filial_name: filial_clean,
            total_reviews,
            average_rating,
            reviews
        }, null, 2));

        await browser.close();

    } catch (err) {
        console.error("Ошибка:", err.message);
        process.exit(1);
    }
})();
