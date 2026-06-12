// Recent 10 match results for each team (most recent first).
// W = Win, D = Draw, L = Loss
// When real API is connected, replace with live data.

const FORM_10: Record<string, string> = {
  // Tier S
  Argentina: "W W D W W W W D W W",
  France: "W W W D W W D W W W",
  Spain: "W D W W W W W D W D",
  Brazil: "D W W W D W D W W D",
  England: "W W D W D W W D W W",
  // Tier A
  Germany: "D W W D W W D W D W",
  Netherlands: "W D W D W W W D D W",
  Portugal: "W W D D W W D W W D",
  Belgium: "W D W W D D W W D W",
  Italy: "W D D W W W D W D W",
  Colombia: "W D D W D W W D W W",
  Croatia: "D W D W W W D W D W",
  // Tier B
  Uruguay: "D W D W D W W D W D",
  USA: "W D W D D W W D D W",
  Mexico: "D D W D W W D W D D",
  Morocco: "W W D D W D W W D D",
  Japan: "W D D W D W W D W D",
  Switzerland: "D W D D W D W W D W",
  Denmark: "D D W W D D W D W W",
  Senegal: "W D D D W W D W D D",
  Iran: "D W D D W D W D W D",
  "South Korea": "D D W D W D W D D W",
  Australia: "D D D W W D W D D W",
  // Tier C
  Turkey: "D W L D W W D L W D",
  Poland: "D L W D W D W L D W",
  Nigeria: "W D L D W D W L D W",
  Chile: "D L D W D W L D W D",
  Peru: "D D L W D D L W D D",
  Serbia: "L D W D D D W L D W",
  Ecuador: "D L D W D D L W D D",
  "Czech Republic": "D D L W D D W L D D",
  Egypt: "D L D D W D L D W D",
  Scotland: "L D D W D L D W D D",
  Tunisia: "D D L D W D L D W D",
  Canada: "L D D W D D L W D D",
  Panama: "D L D D W L D D W D",
  // Tier D
  "Costa Rica": "L D D D W L D D W L",
  Cameroon: "D L D W L D L W D L",
  Paraguay: "L D L D W L D L W D",
  "Saudi Arabia": "L D D W L L D D W L",
  Uzbekistan: "L L D D W D L D W L",
  Albania: "D L L D D L D W L D",
  "Bosnia & Herzegovina": "D L D W L L D D L W",
  Qatar: "L L D D W L D L D W",
  // Tier E
  China: "L L D L D L L D L D",
  Honduras: "L D L L D L D L L D",
  Bolivia: "L L D L D L L D L D",
  Indonesia: "L L L D D L L D L L",
  Bahrain: "L L D L L L D L L D",
  "New Zealand": "L D L L D L L D L D",
};

export interface FormData {
  results: string; // "W D L W W D L W D W"
  last5: string;   // "W D L W W"
  index: number;   // 0-100 状态指数
}

export function getFormData(teamName: string): FormData {
  const raw = FORM_10[teamName] ?? "- - - - - - - - - -";
  const tokens = raw.split(" ");
  const last5 = tokens.slice(0, 5).join(" ");

  // Compute form index: W=3, D=1, L=0, recent matches weighted heavier
  let score = 0;
  let maxScore = 0;
  for (let i = 0; i < tokens.length; i++) {
    const weight = 10 - i; // most recent = 10, oldest = 1
    maxScore += 3 * weight;
    if (tokens[i] === "W") score += 3 * weight;
    else if (tokens[i] === "D") score += 1 * weight;
  }

  const index = Math.round((score / maxScore) * 100);

  return { results: raw, last5, index };
}
