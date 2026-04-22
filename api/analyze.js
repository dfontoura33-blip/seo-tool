export default async function handler(req, res) {
  try {
    const url = req.method === "POST" ? req.body.url : req.query.url;

    if (!url) {
      return res.status(400).json({ error: "URL não informada" });
    }

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(400).json({ error: "Não foi possível acessar a URL" });
    }

    const html = await response.text();

    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "Não encontrado";
    const meta =
      html.match(/<meta name="description" content="(.*?)"/i)?.[1] ||
      "Não encontrado";
    const h1 =
      html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "Não encontrado";

    const h2Count = (html.match(/<h2/gi) || []).length;
    const h3Count = (html.match(/<h3/gi) || []).length;

    const text = html.replace(/<[^>]*>/g, " ");
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    let score = 0;
    let checks = [];

    if (title !== "Não encontrado") {
      score += 20;
      checks.push("✔ Title ok");
    } else checks.push("❌ Sem title");

    if (h1 !== "Não encontrado") {
      score += 20;
      checks.push("✔ H1 ok");
    } else checks.push("❌ Sem H1");

    if (meta !== "Não encontrado" && meta.length > 50) {
      score += 20;
      checks.push("✔ Meta ok");
    } else checks.push("❌ Meta fraca");

    if (wordCount > 300 && wordCount < 3000) {
      score += 20;
      checks.push("✔ Conteúdo ok");
    } else checks.push("⚠ Conteúdo fora do ideal");

    if (h2Count >= 2) {
      score += 10;
      checks.push("✔ H2 ok");
    } else checks.push("❌ Poucos H2");

    if (h3Count >= 1) {
      score += 10;
      checks.push("✔ H3 ok");
    } else checks.push("❌ Sem H3");

    let intent = "Informacional";

    if (/comprar|preço|contratar|orçamento/i.test(html)) {
      intent = "Transacional";
    } else if (/melhor|top|comparar/i.test(html)) {
      intent = "Comercial";
    }

    const suggestedH1 =
      title !== "Não encontrado"
        ? title.replace(/\|.*$/, "").replace(/-.*$/, "").trim()
        : "";

    return res.status(200).json({
      score,
      checks,
      data: {
        title,
        h1,
        meta,
        h2Count,
        h3Count,
        wordCount
      },
      intent,
      suggestedH1
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno",
      detalhe: error.message
    });
  }
}
