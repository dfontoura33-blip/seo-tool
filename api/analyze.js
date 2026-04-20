export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, keyword } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1.*?>(.*?)<\/h1>/i);
    const metaMatch = html.match(/<meta name="description" content="(.*?)"/i);

    const title = titleMatch ? titleMatch[1] : null;
    const h1 = h1Match ? h1Match[1] : null;
    const meta = metaMatch ? metaMatch[1] : null;

    let score = 0;
    const checks = [];

    if (title) {
      score += 10;
      checks.push("✔️ Title encontrado");
    } else {
      checks.push("❌ Title não encontrado");
    }

    if (title && keyword && title.toLowerCase().includes(keyword.toLowerCase())) {
      score += 10;
      checks.push("✔️ Palavra-chave no Title");
    } else {
      checks.push("❌ Palavra-chave não está no Title");
    }

    if (h1) {
      score += 10;
      checks.push("✔️ H1 encontrado");
    } else {
      checks.push("❌ H1 não encontrado");
    }

    if (meta) {
      score += 10;
      checks.push("✔️ Meta description encontrada");
    } else {
      checks.push("❌ Meta description ausente");
    }

    const textContent = html.replace(/<[^>]*>/g, "");
    if (textContent.length > 300) {
      score += 10;
      checks.push("✔️ Conteúdo suficiente");
    } else {
      checks.push("❌ Conteúdo muito curto");
    }

    res.status(200).json({
      score,
      checks,
      title,
      h1,
      meta,
      length: textContent.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao analisar URL' });
  }
}
