export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Função para decodificar HTML (corrige &#xE1; etc)
    function decodeHtml(html) {
      return html
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
        .replace(/&#([0-9]+);/g, (_, num) =>
          String.fromCharCode(num)
        );
    }

    // TITLE
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1]) : null;

    // META DESCRIPTION
    const metaMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );
    const meta = metaMatch ? decodeHtml(metaMatch[1]) : null;

    // H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match ? decodeHtml(h1Match[1]) : null;

    // TAMANHO DO CONTEÚDO
    const textContent = html.replace(/<[^>]+>/g, "");
    const length = textContent.length;

    res.status(200).json({
      title,
      meta,
      h1,
      length
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
