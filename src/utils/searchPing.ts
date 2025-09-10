export async function notifySearchEngines(urls: string[] = []) {
  try {
    if (process.env.NODE_ENV !== "production") return; // evita ruido en dev

    const site = (process.env.FRONTEND_ORIGIN || "").replace(/\/$/, "");
    if (!site) return;

    const host = new URL(site).hostname;
    const sitemapUrl = `${site}/sitemap.xml`;

    // 1) Pingar sitemap (Google y Bing)
    const pingGoogle = fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ).catch(() => {});
    const pingBing = fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ).catch(() => {});

    // 2) IndexNow (Bing y aliados)
    const key = process.env.INDEXNOW_KEY;
    const keyLocation = key ? `${site}/${key}.txt` : undefined;

    const indexNow =
      key && urls.length
        ? fetch("https://api.indexnow.org/IndexNow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host,
              key,
              keyLocation,
              urlList: urls,
            }),
          }).catch(() => {})
        : Promise.resolve();

    await Promise.allSettled([pingGoogle, pingBing, indexNow]);
  } catch {
    // silencioso: esto no debe romper tu request principal
  }
}
