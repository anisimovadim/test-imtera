export function parseYandexReviews(url) {
  return new Promise((resolve, reject) => {
    // 1. Открываем вкладку
    const win = window.open(url, "_blank");

    if (!win) {
      reject("Не удалось открыть вкладку (попробуйте отключить блокировщик всплывающих окон)");
      return;
    }

    // 2. Ставим слушатель сообщений от вкладки
    function handleMessage(event) {
      if (event.data?.type === "YANDEX_REVIEWS_DATA") {
        window.removeEventListener("message", handleMessage);
        win.close();
        resolve(event.data.payload);
      }
    }

    window.addEventListener("message", handleMessage);

    // 3. После загрузки вкладки — вставляем скрипт
    const timer = setInterval(() => {
      if (win.document && win.document.readyState === "complete") {
        clearInterval(timer);

        // Вставка кода, который будет выполнен в новой вкладке
        win.eval(`

          function collectReviews() {
            const items = [...document.querySelectorAll('.business-review-view')];

            const reviews = items.map(el => {
              const author = el.querySelector('.business-review-view__author-name span')?.innerText?.trim() || null;
              const text = el.querySelector('.spoiler-view__text-container')?.innerText?.trim() || null;
              const rating = el.querySelector('[itemprop="ratingValue"]')?.content || null;
              const isoDate = el.querySelector('[itemprop="datePublished"]')?.content;

              let date = null;
              if (isoDate) {
                const d = new Date(isoDate);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                date = dd + '.' + mm + '.' + yyyy;
              }

              return { author, text, rating, date };
            });

            return reviews;
          }

          // Прокрутка страницы + попытка раскрыть текст
          function expandAndScroll(callback) {
            let counter = 0;

            const scrollInterval = setInterval(() => {
              window.scrollBy(0, 1000);

              [...document.querySelectorAll('.business-review-view__expand')].forEach(btn => {
                btn.click();
              });

              counter++;
              if (counter > 10) {
                clearInterval(scrollInterval);

                const data = collectReviews();
                window.opener.postMessage({
                  type: "YANDEX_REVIEWS_DATA",
                  payload: {
                    reviews: data,
                    total: data.length
                  }
                }, "*");
              }
            }, 700);
          }

          expandAndScroll();

        `);
      }
    }, 300);
  });
}
