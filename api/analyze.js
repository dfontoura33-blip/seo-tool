export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    const response = await fetch(url);
    const html = await response.text();

    // EXTRAÇÕES
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || null;
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || null;
    const meta =
      html.match(/<meta name="description" content="(.*?)"/i)?.[1] || null;

    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    const length = text.length;

    // SCORE
    let score = 0;
    let checks = [];

    if (title) {
      score += 25;
      checks.push("✔ Title encontrado");
    } else {
      checks.push("❌ Title não encontrado");
    }

    if (h1) {
      score += 25;
      checks.push("✔ H1 encontrado");
    } else {
      checks.push("❌ H1 não encontrado");
    }

    if (meta) {
      score += 20;
      checks.push("✔ Meta description presente");
    } else {
      checks.push("❌ Meta description ausente");
    }

    if (length > 300 && length < 20000) {
      score += 15;
      checks.push("✔ Conteúdo com tamanho adequado");
    } else {
      checks.push("⚠ Conteúdo muito curto ou muito grande");
    }

    // KEYWORDS
    const words = text
      .replace(/[^\wÀ-ÿ\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 4);

    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(w => w[0]);

    if (topWords.length) {
      score += 15;
      checks.push("✔ Palavras relevantes identificadas");
    }

    // INTENÇÃO
    let intent = "Informacional";
    if (
      text.includes("comprar") ||
      text.includes("preço") ||
      text.includes("serviços") ||
      text.includes("imóveis")
    ) {
      intent = "Comercial";
    }

    // 🔥 SUGESTÕES (VERSÃO SEGURA)
    const main = topWords[0] || "tema";
    const second = topWords[1] || "";

    const suggestedTitles =
      intent === "Comercial"
        ? [
            `${main} ${second} | Melhores opções`,
            `Encontre ${main} ${second} com qualidade`,
            `${main} ${second}: serviços e soluções`
          ]
        : [
            `Guia completo sobre ${main} ${second}`,
            `${main} ${second}: tudo o que você precisa saber`,
            `Aprenda ${main} ${second} com dicas práticas`
          ];

    const suggestedMeta =
      intent === "Comercial"
        ? `Encontre ${main} ${second} com as melhores opções. Veja detalhes e oportunidades.`
        : `Aprenda tudo sobre ${main} ${second} com dicas práticas e atualizadas.`;

    // RESPOSTA
    return res.status(200).json({
      score,
      checks,
      title,
      h1,
      meta,
      length,
      keywords: topWords,
      intent,
      suggestedTitles,
      suggestedMeta
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erro ao analisar",
      detalhe: err.message
    });
  }
}
