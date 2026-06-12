export interface ValueResult {
  homeValue: number;
  drawValue: number;
  awayValue: number;
  bestBet: "home" | "draw" | "away" | "none";
  bestValue: number;
  rating: 1 | 2 | 3 | 4 | 5;
}

export function calculateValueIndex(
  modelProb: { home: number; draw: number; away: number },
  marketProb: { home: number; draw: number; away: number }
): ValueResult {
  const homeValue = Math.round((modelProb.home - marketProb.home) * 100) / 100;
  const drawValue = Math.round((modelProb.draw - marketProb.draw) * 100) / 100;
  const awayValue = Math.round((modelProb.away - marketProb.away) * 100) / 100;

  const values = [
    { key: "home" as const, val: homeValue },
    { key: "draw" as const, val: drawValue },
    { key: "away" as const, val: awayValue },
  ];

  const best = values.reduce((a, b) => (b.val > a.val ? b : a));
  const bestValue = best.val;
  const bestBet = bestValue > 2 ? best.key : "none";

  let rating: 1 | 2 | 3 | 4 | 5;
  if (bestValue >= 15) rating = 5;
  else if (bestValue >= 10) rating = 4;
  else if (bestValue >= 5) rating = 3;
  else if (bestValue >= 2) rating = 2;
  else rating = 1;

  return { homeValue, drawValue, awayValue, bestBet, bestValue, rating };
}
