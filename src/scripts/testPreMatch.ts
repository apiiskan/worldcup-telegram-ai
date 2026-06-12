import { getDb } from "../db/sqlite.js";
import { syncFixtures } from "../scheduler/syncFixturesJob.js";
import { predictMatch } from "../skills/prediction-skill/index.js";
import { sendMessage } from "../telegram/telegramBot.js";
import { preMatchMessage } from "../telegram/messageTemplates.js";
import { getAllFixtures } from "../db/fixtureRepository.js";
import { logger } from "../utils/logger.js";

async function main() {
  getDb();
  await syncFixtures();

  const fixtures = getAllFixtures();
  const first = fixtures[0];
  if (!first) {
    logger.error("No fixtures in DB");
    process.exit(1);
  }

  logger.info(`Testing pre-match push for: ${first.home_team} vs ${first.away_team}`);

  const prediction = await predictMatch(first);
  const text = preMatchMessage(first, prediction);

  logger.info("--- Message Preview ---");
  console.log("\n" + text.replace(/<[^>]+>/g, "") + "\n");
  logger.info("--- Sending to Telegram ---");

  const msgId = await sendMessage(text);
  logger.info(`Sent! message_id: ${msgId}`);
}

main().catch(console.error);
