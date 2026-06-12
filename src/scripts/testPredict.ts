import { predictMatch } from "../skills/prediction-skill/index.js";
import type { FixtureRow } from "../db/fixtureRepository.js";

const fixtures: FixtureRow[] = [
  {
    id: "t1", home_team: "Mexico", away_team: "Japan",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "Estadio Azteca", city: "Mexico City",
    stage: "Group A - Matchday 1", status: "scheduled",
    home_score: null, away_score: null, home_rank: 15, away_rank: 18,
  },
  {
    id: "t2", home_team: "Argentina", away_team: "Peru",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "MetLife Stadium", city: "New York/New Jersey",
    stage: "Group C - Matchday 1", status: "scheduled",
    home_score: null, away_score: null, home_rank: 1, away_rank: 30,
  },
  {
    id: "t3", home_team: "South Korea", away_team: "Germany",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "AT&T Stadium", city: "Dallas",
    stage: "Group H - Matchday 2", status: "scheduled",
    home_score: null, away_score: null, home_rank: 23, away_rank: 8,
  },
  {
    id: "t4", home_team: "Belgium", away_team: "China",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "Rose Bowl", city: "Pasadena",
    stage: "Group J - Matchday 1", status: "scheduled",
    home_score: null, away_score: null, home_rank: 3, away_rank: 70,
  },
];

async function main() {
  for (const f of fixtures) {
    const r = await predictMatch(f);
    const wp = r.winProbability;

    console.log(`
${"=".repeat(55)}
  ${f.home_team} vs ${f.away_team}
  ELO: ${r.elo.home} vs ${r.elo.away}
${"=".repeat(55)}
  Score:  ${r.predictedScore}
  Winner: ${r.winner}
  Risk:   ${"*".repeat(r.riskLevel)} (${r.riskLevel}/5)

  Win%:   H ${wp.home}%  D ${wp.draw}%  A ${wp.away}%  (sum=${wp.home + wp.draw + wp.away})`);

    if (r.marketOdds?.h2h) {
      const o = r.marketOdds.h2h;
      console.log(`
  --- MARKET ODDS (${r.oddsSource}) ---
  1X2:    ${o.home} / ${o.draw} / ${o.away}`);

      if (r.marketOdds.spread) {
        console.log(`  Spread: ${r.marketOdds.spread.line} @ ${r.marketOdds.spread.home}/${r.marketOdds.spread.away}`);
      }
      if (r.marketOdds.total) {
        console.log(`  Total:  ${r.marketOdds.total.line} @ ${r.marketOdds.total.over}/${r.marketOdds.total.under}`);
      }
    }

    if (r.marketProb) {
      const mp = r.marketProb;
      console.log(`
  --- MODEL vs MARKET ---
  ${f.home_team.padEnd(15)} Model ${wp.home}%  Market ${mp.home}%
  ${"Draw".padEnd(15)} Model ${wp.draw}%  Market ${mp.draw}%
  ${f.away_team.padEnd(15)} Model ${wp.away}%  Market ${mp.away}%`);
    }

    if (r.valueIndex) {
      const v = r.valueIndex;
      console.log(`
  --- VALUE INDEX ---
  ${f.home_team.padEnd(15)} ${v.homeValue >= 0 ? "+" : ""}${v.homeValue.toFixed(1)}%
  ${"Draw".padEnd(15)} ${v.drawValue >= 0 ? "+" : ""}${v.drawValue.toFixed(1)}%
  ${f.away_team.padEnd(15)} ${v.awayValue >= 0 ? "+" : ""}${v.awayValue.toFixed(1)}%
  Best bet: ${v.bestBet} (${v.bestValue >= 0 ? "+" : ""}${v.bestValue.toFixed(1)}%)
  Rating:   ${"*".repeat(v.rating)} (${v.rating}/5)`);
    }

    console.log(`
  Rec:    ${r.recommendation}
  O/U:    ${r.overUnder25}
  BTTS:   ${r.bothTeamsToScore}
  Upset:  ${r.upsetProbability}

  Why:
${r.keyReasons.map((r, i) => `    ${i + 1}. ${r}`).join("\n")}
`);
  }
}

main().catch(console.error);
