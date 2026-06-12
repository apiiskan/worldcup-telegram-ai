import { syncFixtures } from "../scheduler/syncFixturesJob.js";
import { getAllFixtures } from "../db/fixtureRepository.js";
import { logger } from "../utils/logger.js";

async function main() {
  const count = await syncFixtures();
  const all = getAllFixtures();
  logger.info(`Total fixtures in DB: ${all.length}`);
  logger.info("First 5 fixtures:");
  for (const f of all.slice(0, 5)) {
    logger.info(`  ${f.kickoff_utc} | ${f.home_team} vs ${f.away_team} | ${f.stage}`);
  }
}

main().catch(console.error);
