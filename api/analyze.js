export default async function handler(req, res) {
  try {
    const url = req.method === "POST" ? req.body.url : req.query.url;

    if (!url) {
      return res.status(400).json({ error: "URL não informada" });
    }

    const fetchPage = async (target) => {
      const r = await fetch(target);
      const html = await r.text();

      const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
      const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "";
      const meta = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || "";

      const h2 = (html.match(/<h2/gi) || []).length;

      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .toLowerCase();

      const words = text.split(/\s+/).filter(w => w.length > 3);

      return {
        title,
        h1,
        meta,
        h2,
        wordsCount: words.length,
        words
      };
    };

    // ===== SUA PÁGINA =====
    const main = await fetchPage(url);

    // ===== KEYWORDS =====
    const freq = {};
    main.words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    const keywords = Object.entries(freq)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([w]) => w);

    const query = keywords[0] || "seo";

    // ===== BUSCAR CONCORRENTES =====
    const search = await fetch(`https://duckduckgo.com/html/?q=${query}`);
    const searchHtml = await search.text();

    const links = [...searchHtml.matchAll(/<a rel="nofollow" class="result__a" href="(.*?)"/g)]
      .slice(0,3)
      .map(m => m[1]);

    let competitors = [];

    for (let link of links) {
      try {
        const data = await fetchPage(link);
        competitors.push(data);
      } catch {}
    }

    // ===== MÉDIA CONCORRENTES =====
    const avgWords = competitors.reduce((a,c)=>a+c.wordsCount,0) / (competitors.length||1);
    const avgH2 = competitors.reduce((a,c)=>a+c.h2,0) / (competitors.length||1);

    // ===== SCORE =====
    let score = 0;
    let checks = [];

    if (main.title) { score+=20; checks.push("✔ Title ok"); } else checks.push("❌ Sem title");
    if (main.h1) { score+=20; checks.push("✔ H1 ok"); } else checks.push("❌ Sem H1");
    if (main.meta.length > 50) { score+=20; checks.push("✔ Meta ok"); } else checks.push("❌ Meta fraca");

    if (main.wordsCount > avgWords * 0.7) {
      score+=20; checks.push("✔ Conteúdo competitivo");
    } else checks.push("❌ Conteúdo fraco vs concorrentes");

    if (main.h2 >= avgH2) {
      score+=20; checks.push("✔ Estrutura competitiva");
    } else checks.push("❌ Estrutura inferior");

    // ===== INTENÇÃO =====
    let intent = "Informacional";
    if (/comprar|preço|contratar/i.test(main.words.join(" "))) intent = "Transacional";
    if (/melhor|top|review/i.test(main.words.join(" "))) intent = "Comercial";

    // ===== CLUSTER =====
    const cluster = keywords.slice(0,3);

    return res.status(200).json({
      score,
      checks,
      keywords,
      cluster,
      competitors: competitors.map(c => ({
        title: c.title,
        words: c.wordsCount,
        h2: c.h2
      })),
      comparison: {
        content: main.wordsCount > avgWords ? "Acima da média" : "Abaixo da média",
        structure: main.h2 >= avgH2 ? "Boa" : "Fraca"
      },
      data: {
        title: main.title,
        h1: main.h1,
        meta: main.meta,
        words: main.wordsCount
      },
      intent
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
