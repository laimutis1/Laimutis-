export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "API key missing" });
  }

  const symbol = req.query.symbol || "SPY";
  const interval = req.query.interval || "15min";

  const symbols = ["SPY", "XAU/USD", "WTI", "BRENT"];
  const intervals = ["15min", "1h", "4h"];

  if (!symbols.includes(symbol) || !intervals.includes(interval)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: "250",
    apikey: key
  });

  try {
    const response = await fetch(
      "https://api.twelvedata.com/time_series?" + params
    );

    const data = await response.json();

    if (!response.ok || data.status === "error" || !Array.isArray(data.values)) {
      return res.status(502).json({
        error: "Market data unavailable"
      });
    }

    res.setHeader("Cache-Control", "s-maxage=60");
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({
      error: "Connection failed"
    });
  }
}
