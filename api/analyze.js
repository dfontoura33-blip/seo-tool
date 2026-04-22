export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // ===== EXTRAÇÃO =====
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || null;
    const meta = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || null;
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || null;

    const h2Count = (html.match(/<h2/gi) || []).length;
    const h3Count = (html.match(/<h3/gi) || []).length;

    const text = html.replace(/<[^>]*>/g, " ");
    const wordCount = text.split(/\s+/).length;

    // ===== SCORE =====
    let score = 0;
    let checks = [];

    if (title) {
      score += 20;
      checks.push({ label: "Title presente", ok: true });
    } else {
      checks.push({ label: "Sem title", ok: false });
    }

    if (h1) {
      score += 20;
      checks.push({ label: "H1 presente", ok: true });
    } else {
      checks.push({ label: "Sem H1", ok: false });
    }

    if (meta && meta.length > 50) {
      score += 20;
      checks.push({ label: "Meta description ok", ok: true });
    } else {
      checks.push({ label: "Meta fraca ou ausente", ok: false });
    }

    if (wordCount > 300 && wordCount < 3000) {
      score += 20;
      checks.push({ label: "Conteúdo com bom tamanho", ok: true });
    } else {
      checks.push({ label: "Conteúdo muito curto ou muito longo", ok: false });
    }

    if (h2Count >= 2) {
      score += 10;
      checks.push({ label: "Boa estrutura de H2", ok: true });
    } else {
      checks.push({ label: "Poucos H2", ok: false });
    }

    if (h3Count >= 1) {
      score += 10;
      checks.push({ label: "Uso de H3", ok: true });
    } else {
      checks.push({ label: "Sem H3", ok: false });
    }

    // ===== INTENÇÃO DE BUSCA =====
    let intent = "Informacional";

    if (html.match(/comprar|preço|contratar|orçamento/i)) {
      intent = "Transacional";
    } else if (html.match(/melhor|top|review|comparar/i)) {
      intent = "Comercial";
    }

    // ===== SUGESTÃO DE H1 (REALISTA) =====
    let suggestedH1 = null;

    if (title) {
      suggestedH1 = title
        .replace(/\|.*$/, "")
        .replace(/-.*$/, "")
        .trim();
    }

    // ===== RESULTADO =====
    res.status(200).json({
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
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
