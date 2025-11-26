#!/usr/bin/env node
const puppeteer = require('puppeteer'); // используем puppeteer, встроенный Chromium
const fs = require('fs');

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
            headless: true, // обязательно headless
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();

        // Отключаем тяжелые ресурсы
        await page.setRequestInterception(true);
        page.on('request', req => {
            const t = req.resourceType();
            if (['image', 'font', 'stylesheet'].includes(t)) req.abort();
            else req.continue();
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Название компании
        await page.waitForSelector('.orgpage-header-view__header', { timeout: 60000 }).catch(() => {});
        const company = await page.$eval('.orgpage-header-view__header', el => el.innerText.trim()).catch(() => null);

        // Количество отзывов
        await page.waitForSelector('.business-rating-amount-view._summary', { timeout: 60000 }).catch(() => {});
        const totalReviewsRaw = await page.$eval('.business-rating-amount-view._summary', el => el.innerText).catch(() => null);
        const totalReviews = totalReviewsRaw ? totalReviewsRaw.replace(/\D/g, '') : null;

        // Средний рейтинг (объединяем три блока)
        const avgParts = await page.$$eval(
            '.business-summary-rating-badge-view__rating-text',
            nodes => nodes.map(n => n.textContent.trim()).filter(Boolean)
        ).catch(() => []);
        let rating = null;
        if (avgParts.length >= 3) {
            rating = parseFloat(`${avgParts[0]}.${avgParts[2]}`);
        }

        // Подгружаем отзывы
        let reviewNodes = [];
        for (let i = 0; i < 10; i++) {
            reviewNodes = await page.$$('.business-review-view');
            if (reviewNodes.length > 0) break;
            await page.evaluate(() => window.scrollBy(0, 1000));
            await sleep(500);
        }

        const first10 = reviewNodes.slice(0, 10);
        const reviews = [];

        for (const node of first10) {
            const expandBtn = await node.$('.business-review-view__expand');
            if (expandBtn) await expandBtn.click().catch(() => {});
            await sleep(50);

            const review = await page.evaluate(el => {
                const q = (sel, attr = 'innerText') => {
                    const n = el.querySelector(sel);
                    if (!n) return null;
                    return attr === 'innerText' ? n.innerText.trim() : n.getAttribute(attr);
                };

                const author = q('.business-review-view__author-name span[itemprop="name"]');
                const ratingVal = q('[itemprop="reviewRating"] meta[itemprop="ratingValue"]', 'content');
                const isoDate = q('.business-review-view__date meta[itemprop="datePublished"]', 'content');
                const text = q('.spoiler-view__text-container');

                let date = null;
                if (isoDate) {
                    const d = new Date(isoDate);
                    const dd = String(d.getDate()).padStart(2,'0');
                    const mm = String(d.getMonth()+1).padStart(2,'0');
                    const yyyy = d.getFullYear();
                    date = `${dd}.${mm}.${yyyy}`;
                }

                return { author, rating: ratingVal ? parseFloat(ratingVal) : null, date, text };
            }, node);

            review.author = safeText(emojiToHtml(review.author));
            review.text = safeText(emojiToHtml(review.text));

            reviews.push(review);
        }

        // Чистый JSON для Laravel
        console.log(JSON.stringify({
            company: safeText(emojiToHtml(company)),
            reviews_count: totalReviews,
            rating,
            reviews
        }));

        await browser.close();

    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
})();
