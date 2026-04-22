export default async function handler(req, res) {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: "Keyword obrigatória" });
  }

  try {
    const apiKey = "4194fd78ef12ce595b7608c2d2c574b130ef8f1351b3266d89c991c4d81fd3a7";

    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&hl=pt-br&gl=br&api_key=${apiKey}`
    );

    const data = await response.json();

    const results = (data.organic_results || []).slice(0, 3).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet
    }));

    res.status(200).json({ results });

  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar SERP" });
  }
}
