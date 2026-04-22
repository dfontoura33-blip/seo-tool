export default async function handler(req, res) {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // TITLE
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "Não encontrado";

    // H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match
      ? h1Match[1].replace(/<[^>]+>/g, "").trim()
      : "Não encontrado";

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

    // SCORE
    let score = 0;
    let maxScore = 100;
    let checks = [];

    if (title !== "Não encontrado") {
      score += 20;
      checks.push("✔️ Title encontrado");
    } else {
      checks.push("❌ Title não encontrado");
    }

    if (h1 !== "Não encontrado") {
      score += 20;
      checks.push("✔️ H1 encontrado");
    } else {
      checks.push("❌ H1 não encontrado");
    }

    if (meta !== "Não encontrado") {
      score += 20;
      checks.push("✔️ Meta description presente");
    } else {
      checks.push("❌ Meta description ausente");
    }

    if (text.length > 500 && text.length < 50000) {
      score += 20;
      checks.push("✔️ Conteúdo com tamanho adequado");
    } else {
      checks.push("⚠️ Conteúdo muito curto ou muito grande");
    }

    if (topWords.length >= 3) {
      score += 20;
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
