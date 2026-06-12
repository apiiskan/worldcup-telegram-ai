import { getFixtures } from "../skills/info-skill/index.js";
import { upsertFixture, getFixtureCount } from "../db/fixtureRepository.js";
import { logger } from "../utils/logger.js";

export async function syncFixtures(): Promise<number> {
  logger.info("Syncing fixtures...");
  const fixtures = await getFixtures();

  for (const f of fixtures) {
    upsertFixture(f);
  }

  const total = getFixtureCount();
  logger.info(`Sync complete: ${fixtures.length} processed, ${total} total in DB`);
  return fixtures.length;
}
