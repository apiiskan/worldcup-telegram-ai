import { predictMatch } from "../skills/prediction-skill/index.js";
import { preMatchMessage } from "../telegram/messageTemplates.js";
import type { FixtureRow } from "../db/fixtureRepository.js";

const fixtures: FixtureRow[] = [
  {
    id: "t1", home_team: "Argentina", away_team: "Peru",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "MetLife Stadium", city: "New York/New Jersey",
    stage: "Group C - Matchday 1", status: "scheduled",
    home_score: null, away_score: null, home_rank: 1, away_rank: 30,
  },
  {
    id: "t2", home_team: "Mexico", away_team: "Japan",
    kickoff_utc: new Date(Date.now() + 3600_000).toISOString(),
    venue: "Estadio Azteca", city: "Mexico City",
    stage: "Group A - Matchday 1", status: "scheduled",
    home_score: null, away_score: null, home_rank: 15, away_rank: 18,
  },
];

async function main() {
  for (const fixture of fixtures) {
    const r = await predictMatch(fixture);
    const msg = preMatchMessage(fixture, r);
    console.log(msg.replace(/<[^>]+>/g, ""));
    console.log("\n\n");
  }
}

main().catch(console.error);
