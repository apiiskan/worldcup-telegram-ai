export interface MarketOdds {
  h2h: { home: number; draw: number; away: number } | null;
  spread: { line: number; home: number; away: number } | null;
  total: { line: number; over: number; under: number } | null;
}

export interface MarketProbability {
  home: number;
  draw: number;
  away: number;
}

export function decimalToImplied(odds: number): number {
  if (odds <= 1) return 100;
  return Math.round((1 / odds) * 10000) / 100;
}

export function removeVig(probs: number[]): number[] {
  const sum = probs.reduce((a, b) => a + b, 0);
  if (sum === 0) return probs;
  return probs.map((p) => Math.round((p / sum) * 10000) / 100);
}

export function h2hToImpliedProbability(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): MarketProbability {
  const raw = [
    decimalToImplied(homeOdds),
    decimalToImplied(drawOdds),
    decimalToImplied(awayOdds),
  ];
  const fair = removeVig(raw);
  return { home: fair[0], draw: fair[1], away: fair[2] };
}

export function extractBestOdds(
  bookmakers: Array<{
    markets: Array<{ key: string; outcomes: Array<{ name: string; price: number; point?: number }> }>;
  }>,
  homeTeam: string
): MarketOdds {
  let h2h: MarketOdds["h2h"] = null;
  let spread: MarketOdds["spread"] = null;
  let total: MarketOdds["total"] = null;

  const allH2h: Array<{ home: number; draw: number; away: number }> = [];
  const allSpread: Array<{ line: number; home: number; away: number }> = [];
  const allTotal: Array<{ line: number; over: number; under: number }> = [];

  for (const bk of bookmakers) {
    for (const mkt of bk.markets) {
      if (mkt.key === "h2h") {
        const home = mkt.outcomes.find((o) => o.name === homeTeam);
        const draw = mkt.outcomes.find((o) => o.name === "Draw");
        const away = mkt.outcomes.find((o) => o.name !== homeTeam && o.name !== "Draw");
        if (home && draw && away) {
          allH2h.push({ home: home.price, draw: draw.price, away: away.price });
        }
      } else if (mkt.key === "spreads") {
        const home = mkt.outcomes.find((o) => o.name === homeTeam);
        const away = mkt.outcomes.find((o) => o.name !== homeTeam);
        if (home?.point !== undefined && away) {
          allSpread.push({ line: home.point, home: home.price, away: away.price });
        }
      } else if (mkt.key === "totals") {
        const over = mkt.outcomes.find((o) => o.name === "Over");
        const under = mkt.outcomes.find((o) => o.name === "Under");
        if (over?.point !== undefined && under) {
          allTotal.push({ line: over.point, over: over.price, under: under.price });
        }
      }
    }
  }

  if (allH2h.length > 0) {
    const avg = (arr: number[]) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
    h2h = {
      home: avg(allH2h.map((o) => o.home)),
      draw: avg(allH2h.map((o) => o.draw)),
      away: avg(allH2h.map((o) => o.away)),
    };
  }

  if (allSpread.length > 0) {
    const mid = allSpread[Math.floor(allSpread.length / 2)];
    spread = mid;
  }

  if (allTotal.length > 0) {
    const mid = allTotal[Math.floor(allTotal.length / 2)];
    total = mid;
  }

  return { h2h, spread, total };
}
