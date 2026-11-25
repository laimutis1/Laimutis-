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

  const symbols = {
    "SPY": "SPY",
    "XAU/USD": "XAU/USD",
    "WTI": "WTI/USD",
    "BRENT": "XBR/USD"
  };

  const intervals = ["15min", "1h", "4h"];

  if (!Object.hasOwn(symbols, symbol) || !intervals.includes(interval)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const params = new URLSearchParams({
    symbol: symbols[symbol],
    interval,
    outputsize: "250",
    timezone: "UTC",
    apikey: key
  });

  try {
    const response = await fetch(
      "https://api.twelvedata.com/time_series?" + params
    );

    const data = await response.json();

    if (!response.ok || data.status === "error" || !Array.isArray(data.values)) {
      return res.status(502).json({
        error: "Twelve Data error: " +
          String(data.message || "Market data unavailable")
            .replaceAll(key, "[hidden]")
      });
    }

    if (data.meta?.symbol !== symbols[symbol]) {
      return res.status(502).json({
        error: "Incorrect market symbol"
      });
    }

    if (data.values.length < 201 || !data.values.every(v =>
      [v.open, v.high, v.low, v.close].every(x =>
        x != null && x !== "" && Number.isFinite(Number(x))
      )
    )) {
      return res.status(502).json({
        error: "Invalid or insufficient market data"
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
