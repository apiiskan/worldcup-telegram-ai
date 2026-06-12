import { config } from "../config.js";
import { getUpcomingUnpushed } from "../db/fixtureRepository.js";
import { savePrediction } from "../db/predictionRepository.js";
import { logPush } from "../db/pushLogRepository.js";
import { predictMatch } from "../skills/prediction-skill/index.js";
import { sendMessage } from "../telegram/telegramBot.js";
import { preMatchMessage } from "../telegram/messageTemplates.js";
import { logger } from "../utils/logger.js";

export async function runPreMatchPush() {
  const cutoffMinutes = config.preMatchMinutes + 5;
  const fixtures = getUpcomingUnpushed(cutoffMinutes);

  if (fixtures.length === 0) {
    logger.debug("No upcoming unpushed fixtures found");
    return;
  }

  logger.info(`Found ${fixtures.length} fixture(s) to push pre-match`);

  for (const fixture of fixtures) {
    try {
      const prediction = await predictMatch(fixture);
      savePrediction(fixture.id, prediction);

      const text = preMatchMessage(fixture, prediction);
      const msgId = await sendMessage(text);

      logPush(fixture.id, "pre_match", msgId);
      logger.info(`Pre-match pushed: ${fixture.home_team} vs ${fixture.away_team}`);
    } catch (err) {
      logger.error({ err, fixtureId: fixture.id }, "Pre-match push failed for fixture");
    }
  }
}
