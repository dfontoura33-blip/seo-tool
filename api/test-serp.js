export default async function handler(req, res) {
  const login = "dsfontoura1@stefanini.com";
  const password = "8a6f627a57b48c39";

  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{
          keyword: "pintor",
          location_code: 2250,
          language_code: "pt"
        }])
      }
    );

    const data = await response.json();

    // 👉 devolve só o essencial (top 5) pra facilitar
    const items = data?.tasks?.[0]?.result?.[0]?.items || [];

    const top5 = items.slice(0, 5).map(i => ({
      title: i.title,
      url: i.url,
      description: i.description
    }));

    res.status(200).json({ top5 });

  } catch (e) {
    res.status(500).json({ error: "Erro na API", detail: e.message });
  }
}
