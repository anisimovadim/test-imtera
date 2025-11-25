const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromiumPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const tempDir = path.join(__dirname, 'temp_puppeteer');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const url = process.argv[2];
if (!url) {
    console.error("URL не передан");
    process.exit(1);
}

// Разрешённые символы — быстрый путь
const allowed = /^[0-9A-Za-zА-Яа-яЁё .,!?\-:;"'()—…]+$/;

function emojiToHtml(str) {
    if (!str) return str;

    // Если без эмодзи — сразу вернуть
    if (allowed.test(str)) return str;

    // Смешанная строка: посимвольная конвертация
    return Array.from(str).map(ch => {
        if (allowed.test(ch)) return ch;
        const code = ch.codePointAt(0);
        return `&#${code};`;
    }).join('');
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
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate'
            ]
        });

        const page = await browser.newPage();

        // Сильнейшее ускорение — запрет загруза картинок, css, шрифтов
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const t = req.resourceType();
            if (t === 'image' || t === 'font' || t === 'stylesheet') {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

        // Не ждём networkidle2 — на Яндексе он бесконечный
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Читаем заголовок филиала
        const filial_name = await page.$eval(
            '.orgpage-header-view__header',
            el => el.innerText.trim(),
            null
        ).catch(() => null);

        const filial_clean = safeText(emojiToHtml(filial_name));

        // Количество оценок
        const total_reviews_raw = await page.$eval(
            '.business-rating-amount-view._summary',
            el => el.innerText,
            null
        ).catch(() => null);

        const total_reviews = total_reviews_raw
            ? total_reviews_raw.replace(/\D/g, '')
            : null;

        // Средняя оценка
        const avg_parts = await page.$$eval(
            '.business-summary-rating-badge-view__rating-text',
            nodes => nodes.map(n => n.textContent.trim()).filter(Boolean)
        ).catch(() => []);

        let average_rating = null;
        if (avg_parts.length >= 3) {
            average_rating = parseFloat(avg_parts[0] + '.' + avg_parts[2]);
        }

        // Список отзывов
        const reviewNodes = await page.$$('.business-review-view');
        const first10 = reviewNodes.slice(0, 10);

        // Раскрываем текст отзывов
        for (const node of first10) {
            const expandBtn = await node.$('.business-review-view__expand');
            if (expandBtn) {
                await expandBtn.click().catch(() => {});
                await new Promise(r => setTimeout(r, 40));
            }
        }

        // Быстрый парсинг отзывов
        const reviews = [];
        for (const node of first10) {
            const review = await page.evaluate(el => {
                const get = (selector, attr = 'innerText') => {
                    const n = el.querySelector(selector);
                    if (!n) return null;
                    return attr === 'innerText'
                        ? n.innerText.trim()
                        : n.getAttribute(attr);
                };

                const author = get('.business-review-view__author-name span[itemprop="name"]');
                const rating = get('[itemprop="reviewRating"] meta[itemprop="ratingValue"]', 'content');
                const isoDate = get('.business-review-view__date meta[itemprop="datePublished"]', 'content');

                let date = null;
                if (isoDate) {
                    const d = new Date(isoDate);
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    const hh = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    date = `${dd}.${mm}.${yyyy} ${hh}:${min}`;
                }

                const textBlock = el.querySelector('.spoiler-view__text-container');
                const text = textBlock ? textBlock.innerText.trim() : null;

                return {
                    author,
                    rating,
                    date,
                    text
                };
            }, node);

            review.author = safeText(emojiToHtml(review.author));
            review.text = safeText(emojiToHtml(review.text));

            reviews.push({
                author: review.author,
                rating: review.rating ? parseFloat(review.rating) : null,
                date: review.date,
                text: review.text
            });
        }

        // Вывод результата
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
