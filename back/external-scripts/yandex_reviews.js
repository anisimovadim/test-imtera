#!/usr/bin/env node
const puppeteer = require('puppeteer');

// Путь к кэшу Puppeteer
process.env.PUPPETEER_CACHE_DIR = '/var/cache/puppeteer';

const chromiumPath = `/usr/bin/google-chrome`;

const url = process.argv[2];
if (!url) {
    console.error("[ERROR] URL не передан");
    process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const allowed = /^[0-9A-Za-zА-Яа-яЁё .,!?\-:;"'()—…]+$/;

function emojiToHtml(str) {
    if (!str) return null;
    if (allowed.test(str)) return str;
    return Array.from(str).map(ch => allowed.test(ch) ? ch : `&#${ch.codePointAt(0)};`).join('');
}

function safeText(str) {
    if (!str) return null;
    return Buffer.from(str, 'utf8').toString();
}

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: chromiumPath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            userDataDir: '/var/www/chrome-data'
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', req => {
            const t = req.resourceType();
            if (['image', 'font', 'stylesheet'].includes(t)) req.abort();
            else req.continue();
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

        const company = await page.$eval('.orgpage-header-view__header', el => el.innerText.trim()).catch(() => null);
        const totalReviewsRaw = await page.$eval('.business-rating-amount-view._summary', el => el.innerText).catch(() => null);
        const totalReviews = totalReviewsRaw ? totalReviewsRaw.replace(/\D/g, '') : null;

        const avgParts = await page.$$eval('.business-summary-rating-badge-view__rating-text', nodes => nodes.map(n => n.textContent.trim()).filter(Boolean)).catch(() => []);
        let rating = null;
        if (avgParts.length >= 3) rating = parseFloat(`${avgParts[0]}.${avgParts[2]}`);

        // Получаем первые 10 отзывов
        let reviewNodes = [];
        for (let i = 0; i < 10; i++) {
            reviewNodes = await page.$$('.business-review-view');
            if (reviewNodes.length > 0) break;
            await page.evaluate(() => window.scrollBy(0, 1000));
            await sleep(500);
        }

        const reviews = [];
        const first10 = reviewNodes.slice(0, 10);

        // Функция безопасного раскрытия текста отзыва
        async function expandReview(node) {
            try {
                const expandBtn = await node.$('.spoiler-view__toggle');
                if (expandBtn) {
                    await expandBtn.click();
                    await sleep(200); // дать время тексту прогрузиться
                }
            } catch (e) {}
        }

        async function getReviewText(node) {
            for (let i = 0; i < 10; i++) {
                await expandReview(node);
                const text = await node.$eval('.spoiler-view__text-container', el => el.innerText.trim()).catch(() => null);
                if (text && text.length > 0) return text;
                await sleep(200);
            }
            return null;
        }

        for (const node of first10) {
            const review = await page.evaluate(el => {
                const q = (sel, attr = 'innerText') => {
                    const n = el.querySelector(sel);
                    if (!n) return null;
                    return attr === 'innerText' ? n.innerText.trim() : n.getAttribute(attr);
                };
                const author = q('.business-review-view__author-name span[itemprop="name"]');
                const ratingVal = q('[itemprop="reviewRating"] meta[itemprop="ratingValue"]', 'content');
                const isoDate = q('.business-review-view__date meta[itemprop="datePublished"]', 'content');
                return { author, rating: ratingVal ? parseFloat(ratingVal) : null, isoDate };
            }, node);

            // Получаем текст через безопасную функцию
            review.text = await getReviewText(node);

            // Форматируем дату
            if (review.isoDate) {
                const d = new Date(review.isoDate);
                const dd = String(d.getDate()).padStart(2,'0');
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const yyyy = d.getFullYear();
                review.date = `${dd}.${mm}.${yyyy}`;
            } else {
                review.date = null;
            }

            review.author = safeText(emojiToHtml(review.author));
            review.text = safeText(emojiToHtml(review.text));
            delete review.isoDate;

            reviews.push(review);
        }

        console.log(JSON.stringify({ company: safeText(emojiToHtml(company)), reviews_count: totalReviews, rating, reviews }));

        await browser.close();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
})();
