export default async function handler(req, res) {
  try {
    // aceita POST e GET (evita erro silencioso)
    const url = req.method === "POST" ? req.body.url : req.query.url;

    if (!url) {
      return res.status(400).json({ error: "URL obrigatória" });
    }

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(400).json({ error: "Erro ao acessar a URL" });
    }

    const html = await response.text();

    // ===== EXTRAÇÃO =====
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    const meta = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || "";
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "";

    const h2Count = (html.match(/<h2/gi) || []).length;
    const h3Count = (html.match(/<h3/gi) || []).length;

    const cleanText = html.replace(/<[^>]*>/g, " ");
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // ===== SCORE =====
    let score = 0;
    let checks = [];

    if (title) {
      score += 20;
      checks.push({ label: "Title ok", ok: true });
    } else {
      checks.push({ label: "Sem title", ok: false });
    }

    if (h1) {
      score += 20;
      checks.push({ label: "H1 ok", ok: true });
    } else {
      checks.push({ label: "Problema no H1", ok: false });
    }

    if (meta && meta.length > 50) {
      score += 20;
      checks.push({ label: "Meta ok", ok: true });
    } else {
      checks.push({ label: "Meta fraca", ok: false });
    }

    if (wordCount > 300 && wordCount < 3000) {
      score += 20;
      checks.push({ label: "Conteúdo ok", ok: true });
    } else {
      checks.push({ label: "Conteúdo fora do ideal", ok: false });
    }

    if (h2Count >= 2) {
      score += 10;
      checks.push({ label: "Boa estrutura H2", ok: true });
    } else {
      checks.push({ label: "Poucos H2", ok: false });
    }

    if (h3Count >= 1) {
      score += 10;
      checks.push({ label: "Uso de H3", ok: true });
    } else {
      checks.push({ label: "Sem H3", ok: false });
    }

    // ===== INTENÇÃO =====
    let intent = "Informacional";

    if (/comprar|preço|contratar|orçamento/i.test(html)) {
      intent = "Transacional";
    } else if (/melhor|top|review|comparar/i.test(html)) {
      intent = "Comercial";
    }

    // ===== SUGESTÃO H1 =====
    let suggestedH1 = title
      ? title.replace(/\|.*$/, "").replace(/-.*$/, "").trim()
      : "";

    // ===== RETORNO =====
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
      detalhe: error.message // 👈 isso ajuda a debuggar
    });
  }
}
