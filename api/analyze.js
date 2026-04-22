export default async function handler(req, res) {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || "";
    const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, "") || "";

    const meta = (html.match(/<meta name="description" content="(.*?)"/i) || [])[1] || "";

    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();

    const words = text.split(/\s+/);

    // STOPWORDS
    const stopwords = ["de","a","o","e","do","da","em","um","para","com","não","uma","os","no","se","na","por","mais","as","dos"];

    const freq = {};

    words.forEach(word => {
      if (word.length > 4 && !stopwords.includes(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });

    const topWords = Object.entries(freq)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5)
      .map(w => w[0]);

    // INTENÇÃO
    let intent = "Informacional";

    if (text.includes("comprar") || text.includes("preço") || text.includes("contratar")) {
      intent = "Transacional";
    } else if (text.includes("melhor") || text.includes("top") || text.includes("comparar")) {
      intent = "Comercial";
    }

    // TITLE SUGERIDO
    const suggestedTitle = topWords.length
      ? `${topWords[0]} ${topWords[1] || ""} | Guia Completo`
      : title;

    // META SUGERIDA
    const suggestedMeta = topWords.length
      ? `Descubra tudo sobre ${topWords.join(", ")}. Veja dicas, serviços e informações completas.`
      : meta;

    res.status(200).json({
      title,
      h1,
      meta,
      text,
      topWords,
      intent,
      suggestedTitle,
      suggestedMeta
    });

  } catch {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
