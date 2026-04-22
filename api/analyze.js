export default async function handler(req, res) {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // TITLE
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "Não encontrado";

    // H1 (contar quantos existem)
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gis);
    const h1 = h1Matches
      ? h1Matches[0].replace(/<[^>]+>/g, "").trim()
      : "Não encontrado";

    const h1Count = h1Matches ? h1Matches.length : 0;

    // META
    const metaMatch =
      html.match(/<meta name=["']description["'] content=["'](.*?)["']/i) ||
      html.match(/<meta content=["'](.*?)["'] name=["']description["']/i);

    const meta = metaMatch ? metaMatch[1].trim() : "Não encontrado";

    // LIMPAR HTML
    let text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();

    text = text.replace(/\b(data|index|class|function|var|const)\b/g, "");

    const words = text.split(/\s+/);

    const stopwords = [
      "de","a","o","e","do","da","em","um","para","com","não","uma","os",
      "no","se","na","por","mais","as","dos","como","mas","foi","ao"
    ];

    const freq = {};

    words.forEach(word => {
      if (
        word.length > 4 &&
        !stopwords.includes(word) &&
        /^[a-zà-ú]+$/i.test(word)
      ) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });

    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(w => w[0]);

    // INTENÇÃO
    let intent = "Informacional";

    if (text.includes("comprar") || text.includes("preço")) {
      intent = "Transacional";
    } else if (text.includes("melhor") || text.includes("comparar")) {
      intent = "Comercial";
    }

    // SUGESTÕES
    const suggestedTitle =
      topWords.length >= 2
        ? `${topWords[0]} ${topWords[1]} | Guia Completo`
        : title;

    const suggestedMeta =
      topWords.length
        ? `Descubra tudo sobre ${topWords.join(", ")}. Veja dicas e soluções completas.`
        : meta;

    // =========================
    // SCORE MAIS INTELIGENTE
    // =========================

    let score = 0;
    let maxScore = 100;
    let checks = [];

    // TITLE
    if (title !== "Não encontrado") {
      score += 20;
      checks.push("✔️ Title encontrado");

      if (title.length >= 30 && title.length <= 60) {
        score += 5;
        checks.push("✔️ Title com tamanho ideal");
      } else {
        checks.push("⚠️ Title fora do tamanho ideal (30-60)");
      }

    } else {
      checks.push("❌ Title não encontrado");
    }

    // H1
    if (h1 !== "Não encontrado") {
      score += 20;
      checks.push("✔️ H1 encontrado");

      if (h1Count > 1) {
        checks.push("⚠️ Mais de um H1 encontrado");
      }

    } else {
      checks.push("❌ H1 não encontrado");
    }

    // META
    if (meta !== "Não encontrado") {
      score += 20;
      checks.push("✔️ Meta description presente");

      if (meta.length >= 120 && meta.length <= 160) {
        score += 5;
        checks.push("✔️ Meta com tamanho ideal");
      } else {
        checks.push("⚠️ Meta fora do tamanho ideal (120-160)");
      }

    } else {
      checks.push("❌ Meta description ausente");
    }

    // CONTEÚDO
    if (text.length > 800 && text.length < 50000) {
      score += 15;
      checks.push("✔️ Conteúdo com tamanho adequado");
    } else {
      checks.push("⚠️ Conteúdo muito curto ou muito grande");
    }

    // PALAVRAS
    if (topWords.length >= 3) {
      score += 15;
      checks.push("✔️ Palavras relevantes identificadas");
    } else {
      checks.push("⚠️ Poucas palavras relevantes");
    }

    res.status(200).json({
      score,
      maxScore,
      checks,
      title,
      h1,
      meta,
      topWords,
      intent,
      suggestedTitle,
      suggestedMeta
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
