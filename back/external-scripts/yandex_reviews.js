#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromiumPath = process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/google-chrome';

const tempDir = path.join(__dirname, 'temp_puppeteer');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const url = process.argv[2];
if (!url) {
    console.error("URL не передан");
    process.exit(1);
}

const allowed = /^[0-9A-Za-zА-Яа-яЁё .,!?\-:;"'()—…]+$/;

function emojiToHtml(str) {
    if (!str) return str;
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

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const filial_name = await page.$eval('.orgpage-header-view__header', el => el.innerText.trim()).catch(() => null);
        const filial_clean = safeText(emojiToHtml(filial_name));

        const total_reviews_raw = await page.$eval('.business-rating-amount-view._summary', el => el.innerText).catch(() => null);
        const total_reviews = total_reviews_raw ? total_reviews_raw.replace(/\D/g, '') : null;

        const avg_parts = await page.$$eval('.business-summary-rating-badge-view__rating-text', nodes => nodes.map(n => n.textContent.trim()).filter(Boolean)).catch(() => []);
        const average_rating = avg_parts.length >= 3 ? parseFloat(avg_parts[0] + '.' + avg_parts[2]) : null;

        // Скроллим и раскрываем все кнопки "Ещё"
        let expandButtonsExist = true;
        while (expandButtonsExist) {
            expandButtonsExist = await page.$$eval('.business-review-view__expand', buttons => {
                if (buttons.length === 0) return false;
                buttons.forEach(btn => btn.click());
                return true;
            });
            if (expandButtonsExist) await page.evaluate(() => window.scrollBy(0, 1000));
            await new Promise(r => setTimeout(r, 200));
        }

        // Парсим все отзывы
        const reviewNodes = await page.$$('.business-review-view');
        const reviews = [];
        for (const node of reviewNodes) {
            const review = await page.evaluate(el => {
                const get = (selector, attr = 'innerText') => {
                    const n = el.querySelector(selector);
                    if (!n) return null;
                    return attr === 'innerText' ? n.innerText.trim() : n.getAttribute(attr);
                };

                const author = get('.business-review-view__author-name span[itemprop="name"]');
                const rating = get('[itemprop="reviewRating"] meta[itemprop="ratingValue"]', 'content');
                const isoDate = get('.business-review-view__date meta[itemprop="datePublished"]', 'content');

                // let date = null;
                // if (isoDate) {
                //     const d = new Date(isoDate);
                //     const dd = String(d.getDate()).padStart(2, '0');
                //     const mm = String(d.getMonth() + 1).padStart(2, '0');
                //     const yyyy = d.getFullYear();
                //     const hh = String(d.getHours()).padStart(2, '0');
                //     const min = String(d.getMinutes()).padStart(2, '0');
                //     date = `${dd}.${mm}.${yyyy} ${hh}:${min}`;
                // }

                const textBlock = el.querySelector('.spoiler-view__text-container');
                const text = textBlock ? textBlock.innerText.trim() : null;

                return { author, rating, isoDate, text };
            }, node);

            review.author = safeText(emojiToHtml(review.author));
            review.text = safeText(emojiToHtml(review.text));

            reviews.push({
                author: review.author,
                rating: review.rating ? parseFloat(review.rating) : null,
                date: review.isoDate,
                text: review.text
            });
        }

        console.log(JSON.stringify({
            filial_name: filial_clean,
            total_reviews,
            average_rating,
            reviews
        }, null, 2));

        await browser.close();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
