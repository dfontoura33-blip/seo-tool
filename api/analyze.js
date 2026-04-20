export default async function handler(req, res) {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // TITLE
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    // H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "") : null;

    // META DESCRIPTION
    const metaMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const meta = metaMatch ? metaMatch[1] : null;

    // LIMPAR HTML → TEXTO
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();

    const words = text.split(/\s+/);

    // STOPWORDS (palavras irrelevantes)
    const stopwords = [
      "de","a","o","e","do","da","em","um","para","com","não","uma",
      "os","no","se","na","por","mais","as","dos","como","mas","foi",
      "ao","ele","das","tem","à","seu","sua","ou","ser","quando","muito",
      "há","nos","já","está","eu","também","só","pelo","pela","até"
    ];

    const freq = {};

    words.forEach(word => {
      if (word.length > 4 && !stopwords.includes(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });

    // TOP 5 palavras mais frequentes
    const sugestoes = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(item => item[0]);

    res.status(200).json({
      title,
      h1,
      meta,
      length: text.length,
      sugestoes
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao analisar URL" });
  }
}
