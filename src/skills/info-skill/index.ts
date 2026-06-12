import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";
import { fetchFixturesFromApi } from "./footballApiClient.js";
import { loadMockFixtures } from "./mockData.js";
import type { NormalizedFixture } from "./normalizeFixture.js";
export type { NormalizedFixture } from "./normalizeFixture.js";

export async function getFixtures(): Promise<NormalizedFixture[]> {
  if (config.football.provider === "mock" || !config.football.apiKey) {
    logger.info("info-skill: loading mock fixtures");
    return loadMockFixtures();
  }

  try {
    const fixtures = await fetchFixturesFromApi();
    if (fixtures.length > 0) return fixtures;
    logger.warn("info-skill: API returned 0 fixtures, falling back to mock");
    return loadMockFixtures();
  } catch (err) {
    logger.error({ err }, "info-skill: API fetch failed, falling back to mock");
    return loadMockFixtures();
  }
}
