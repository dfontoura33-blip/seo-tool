export default async function handler(req, res) {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || null;

    const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, "") || null;

    const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
    const h2Count = h2Matches.length;

    const meta = (html.match(/<meta name="description" content="(.*?)"/i) || [])[1] || null;

    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();

    const words = text.split(/\s+/);
    const length = text.length;

    res.status(200).json({
      title,
      h1,
      meta,
      h2Count,
      text,
      length
    });

  } catch {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
