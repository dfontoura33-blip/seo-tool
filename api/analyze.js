export default async function handler(req, res) {
  try {
    const url = req.method === "POST" ? req.body.url : req.query.url;

    if (!url) {
      return res.status(400).json({ error: "URL não informada" });
    }

    // ===== FETCH PÁGINA =====
    const response = await fetch(url);
    const html = await response.text();

    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    const meta = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || "";
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "";

    const h2Count = (html.match(/<h2/gi) || []).length;
    const h3Count = (html.match(/<h3/gi) || []).length;

    // ===== LIMPEZA DE TEXTO PROFISSIONAL =====
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .toLowerCase();

    let words = text.split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => /^[a-zà-ú]+$/i.test(w)); // remove lixo técnico

    const stopwords = [
      "para","como","mais","com","sem","isso","essa","esse","sobre",
      "tudo","cada","onde","quando","porque","entre","muito","muitos",
      "das","dos","nos","nas","uma","uns","umas","ser","ter"
    ];

    words = words.filter(w => !stopwords.includes(w));

    const wordCount = words.length;

    // ===== KEYWORDS LIMPOS =====
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    const keywords = Object.entries(freq)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5)
      .map(([w]) => w);

    const cluster = keywords.slice(0,3);

    // ===== SCORE REALISTA =====
    let score = 0;
    let checks = [];

    if (title) { score += 15; checks.push("✔ Title presente"); }
    else checks.push("❌ Sem title");

    if (h1) { score += 15; checks.push("✔ H1 presente"); }
    else checks.push("❌ Sem H1");

    if (meta.length > 70 && meta.length < 160) {
      score += 15;
      checks.push("✔ Meta bem otimizada");
    } else {
      checks.push("❌ Meta fraca");
    }

    if (wordCount > 600 && wordCount < 2500) {
      score += 20;
      checks.push("✔ Conteúdo ideal");
    } else {
      checks.push("⚠ Conteúdo fora do ideal");
    }

    if (h2Count >= 3) {
      score += 15;
      checks.push("✔ Boa estrutura H2");
    } else {
      checks.push("❌ Estrutura fraca");
    }

    if (h3Count >= 1) {
      score += 10;
      checks.push("✔ Uso de H3");
    } else {
      checks.push("❌ Falta H3");
    }

    // penalização (importante!)
    if (!title || !h1) score -= 10;

    score = Math.max(20, Math.min(score, 95)); // nunca 100 fake

    // ===== INTENÇÃO =====
    let intent = "Informacional";
    if (/comprar|preço|contratar/i.test(text)) intent = "Transacional";
    else if (/melhor|top|review|comparar/i.test(text)) intent = "Comercial";

    // ===== CONCORRENTES (GARANTIDO) =====
    const competitors = [
      { title: "Concorrente A (simulado)", words: 1200, h2: 5 },
      { title: "Concorrente B (simulado)", words: 950, h2: 4 },
      { title: "Concorrente C (simulado)", words: 1400, h2: 6 }
    ];

    const avgWords = 1180;
    const avgH2 = 5;

    const comparison = {
      content: wordCount > avgWords ? "Acima da média" : "Abaixo da média",
      structure: h2Count >= avgH2 ? "Boa" : "Precisa melhorar"
    };

    return res.status(200).json({
      score,
      checks,
      keywords,
      cluster,
      competitors,
      comparison,
      data: {
        title,
        h1,
        meta,
        words: wordCount
      },
      intent
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
