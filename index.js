import htmlContent from './index.html'; // Cloudflare автоматически импортирует ваш HTML

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Если зайти на сайт воркера через браузер — покажем ваш HTML-файл
    if (url.pathname === "/") {
      return new Response(htmlContent, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // Здесь в будущем будет обработчик Webhook от Telegram
    if (request.method === "POST") {
      try {
        const update = await request.json();
        // Логика ответов бота будет прописываться тут
        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
