// ELO ratings for national teams (June 2026 estimates).
// Source model: eloratings.net methodology — W/D/L weighted by opponent
// strength, tournament importance (x3 for World Cup), goal margin capped at 3.
// These are the PRIMARY strength signal, ahead of FIFA ranking.

const ELO: Record<string, number> = {
  // Tier S (2000+)
  Argentina: 2110,
  France: 2080,
  Spain: 2060,
  Brazil: 2020,
  England: 2010,
  // Tier A (1900-2000)
  Germany: 1980,
  Netherlands: 1960,
  Portugal: 1950,
  Belgium: 1940,
  Italy: 1920,
  Colombia: 1910,
  Croatia: 1900,
  // Tier B (1800-1900)
  Uruguay: 1890,
  USA: 1870,
  Mexico: 1860,
  Morocco: 1855,
  Japan: 1850,
  Switzerland: 1840,
  Denmark: 1830,
  Senegal: 1825,
  Iran: 1810,
  "South Korea": 1805,
  Australia: 1800,
  // Tier C (1700-1800)
  Turkey: 1790,
  Poland: 1780,
  Nigeria: 1775,
  Chile: 1770,
  Peru: 1760,
  Serbia: 1755,
  Ecuador: 1750,
  "Czech Republic": 1740,
  Egypt: 1730,
  Scotland: 1720,
  Tunisia: 1710,
  Canada: 1705,
  Panama: 1700,
  // Tier D (1600-1700)
  "Costa Rica": 1690,
  Cameroon: 1680,
  Paraguay: 1670,
  "Saudi Arabia": 1660,
  Uzbekistan: 1630,
  Albania: 1620,
  "Bosnia & Herzegovina": 1610,
  Qatar: 1600,
  // Tier E (<1600)
  China: 1520,
  Honduras: 1510,
  Bolivia: 1500,
  Indonesia: 1450,
  Bahrain: 1440,
  "New Zealand": 1430,
};

export function getElo(teamName: string): number {
  return ELO[teamName] ?? 1500;
}

// Expected score using standard ELO formula
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

// Convert ELO expected scores into win/draw/away percentages
export function eloProbabilities(
  homeElo: number,
  awayElo: number
): { home: number; draw: number; away: number } {
  const homeAdv = 60; // home/neutral slight advantage in World Cup
  const eH = expectedScore(homeElo + homeAdv, awayElo);
  const eA = expectedScore(awayElo, homeElo + homeAdv);

  // Draw probability derived from closeness
  const eloDiff = Math.abs(homeElo - awayElo);
  const drawBase = Math.max(0.15, 0.32 - eloDiff * 0.0004);

  const homeRaw = eH * (1 - drawBase);
  const awayRaw = eA * (1 - drawBase);

  // Normalize to 100
  const total = homeRaw + drawBase + awayRaw;
  const home = Math.round((homeRaw / total) * 100);
  const away = Math.round((awayRaw / total) * 100);
  const draw = 100 - home - away;

  return { home, draw, away };
}
