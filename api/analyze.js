export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    const response = await fetch(url);
    let html = await response.text();

    // =========================
    // LIMPEZA REAL (REMOVE JS E CSS)
    // =========================
    html = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    const meta =
      html.match(/<meta name="description" content="(.*?)"/i)?.[1] || "";

    const h1List = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1]);
    const h2List = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1]);
    const h3List = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)].map(m => m[1]);

    const text = html
      .replace(/<[^>]+>/g, " ")
      .toLowerCase()
      .replace(/[^\wÀ-ÿ\s]/g, "");

    const words = text.split(/\s+/);

    // =========================
    // STOPWORDS + FILTRO INTELIGENTE
    // =========================
    const stopwords = [
      "para","com","uma","como","mais","sobre","entre",
      "http","https","www","index","function","return"
    ];

    const filtered = words.filter(
      w => w.length > 4 && !stopwords.includes(w)
    );

    const freq = {};
    filtered.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    const sorted = Object.entries(freq)
      .filter(([word]) => !word.includes("document"))
      .sort((a, b) => b[1] - a[1]);

    const topWords = sorted.slice(0, 5).map(w => w[0]);

    // =========================
    // DENSIDADE
    // =========================
    const total = filtered.length;

    const density = sorted.slice(0, 5).map(([word, count]) => ({
      word,
      percent: ((count / total) * 100).toFixed(2)
    }));

    // =========================
    // SCORE (mantido)
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

    if (text.length > 3000) {
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
    // SUGESTÕES INTELIGENTES (BASEADAS NO TITLE)
    // =========================
    const base = title.split("|")[0]?.trim() || topWords[0] || "";

    const suggestedTitles = [
      `${base} | Guia completo atualizado`,
      `${base}: tudo o que você precisa saber`,
      `${base} vale a pena? Veja análise completa`
    ];

    const suggestedMeta = meta
      ? meta
      : `Veja tudo sobre ${base}, com informações claras, benefícios e dicas práticas para melhores resultados.`;

    const suggestedH1 = h1List[0] || base;

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
