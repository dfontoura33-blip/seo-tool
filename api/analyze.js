export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // =========================
    // EXTRAÇÕES
    // =========================
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const metaMatch = html.match(/<meta name="description" content="(.*?)"/i);

    const title = titleMatch ? titleMatch[1] : null;
    const h1 = h1Match ? h1Match[1] : null;
    const meta = metaMatch ? metaMatch[1] : null;

    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    const length = text.length;

    // =========================
    // SCORE
    // =========================
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

    // =========================
    // KEYWORDS
    // =========================
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

    if (topWords.length > 0) {
      score += 15;
      checks.push("✔ Palavras relevantes identificadas");
    }

    // =========================
    // INTENÇÃO DE BUSCA
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
    // SUGESTÕES PROFISSIONAIS
    // =========================
    const main = topWords[0] || "";
    const second = topWords[1] || "";

    let suggestedTitles = [];

    if (intent === "Comercial") {
      suggestedTitles = [
        `${main} ${second} | Melhores opções e serviços`,
        `Encontre ${main} ${second} com qualidade`,
        `${main} ${second}: soluções completas para você`
      ];
    } else {
      suggestedTitles = [
        `Guia completo sobre ${main} ${second}`,
        `${main} ${second}: tudo o que você precisa saber`,
        `Aprenda sobre ${main} ${second} com dicas práticas`
      ];
    }

    let suggestedMeta = "";

    if (intent === "Comercial") {
      suggestedMeta = `Encontre ${main} ${second} com as melhores opções do mercado. Veja detalhes, preços e oportunidades.`;
    } else {
      suggestedMeta = `Aprenda tudo sobre ${main} ${second} com dicas práticas e estratégias atualizadas.`;
    }

    // =========================
    // RESPOSTA FINAL
    // =========================
    res.status(200).json({
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

  } catch (error) {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
