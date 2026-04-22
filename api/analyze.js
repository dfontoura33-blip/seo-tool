export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    const response = await fetch(url);
    const html = await response.text();

    // =========================
    // EXTRAÇÃO
    // =========================
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    const meta =
      html.match(/<meta name="description" content="(.*?)"/i)?.[1] || "";

    const h1List = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1]);
    const h2List = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1]);
    const h3List = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)].map(m => m[1]);

    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    const length = text.length;

    // =========================
    // KEYWORDS (LIMPAS)
    // =========================
    const stopwords = ["para", "com", "uma", "como", "mais", "sobre", "entre"];

    const words = text
      .replace(/[^\wÀ-ÿ\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopwords.includes(w));

    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const topWords = sorted.slice(0, 5).map(w => w[0]);

    // =========================
    // DENSIDADE
    // =========================
    const totalWords = words.length;
    const density = sorted.slice(0, 5).map(([word, count]) => ({
      word,
      percent: ((count / totalWords) * 100).toFixed(2)
    }));

    // =========================
    // SCORE MAIS INTELIGENTE
    // =========================
    let score = 0;
    let checks = [];

    if (title.length > 10) {
      score += 20;
      checks.push("✔ Title ok");
    } else checks.push("❌ Title fraco");

    if (h1List.length === 1) {
      score += 15;
      checks.push("✔ H1 único");
    } else checks.push("❌ Problema no H1");

    if (meta.length > 50) {
      score += 15;
      checks.push("✔ Meta boa");
    } else checks.push("❌ Meta fraca");

    if (length > 3000) {
      score += 20;
      checks.push("✔ Conteúdo forte");
    } else checks.push("⚠ Conteúdo fraco");

    if (h2List.length > 2) {
      score += 10;
      checks.push("✔ Estrutura boa (H2)");
    } else checks.push("❌ Poucos H2");

    if (topWords.length > 0) {
      score += 10;
      checks.push("✔ Keywords detectadas");
    }

    // =========================
    // INTENÇÃO
    // =========================
    let intent = "Informacional";

    if (
      text.includes("comprar") ||
      text.includes("preço") ||
      text.includes("serviços") ||
      text.includes("imóveis")
    ) {
      intent = "Comercial";
    }

    // =========================
    // SUGESTÕES
    // =========================
    const main = topWords[0] || "";

    const suggestedH1 = main
      ? `${main.charAt(0).toUpperCase() + main.slice(1)}: guia completo`
      : "";

    const suggestedTitles = [
      `${main} | Guia completo`,
      `${main}: tudo o que você precisa saber`,
      `Como melhorar ${main} (guia prático)`
    ];

    const suggestedMeta = `Aprenda sobre ${main} com dicas práticas e estratégias atualizadas para melhorar seus resultados.`;

    // =========================
    // RESPOSTA
    // =========================
    res.status(200).json({
      score,
      checks,
      title,
      meta,
      h1: h1List,
      h2: h2List,
      h3: h3List,
      length,
      keywords: topWords,
      density,
      intent,
      suggestedH1,
      suggestedTitles,
      suggestedMeta
    });

  } catch (err) {
    res.status(500).json({ error: "Erro na análise" });
  }
}
