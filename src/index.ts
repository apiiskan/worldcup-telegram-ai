import cron from "node-cron";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { getDb } from "./db/sqlite.js";
import { testConnection } from "./telegram/telegramBot.js";
import { syncFixtures } from "./scheduler/syncFixturesJob.js";
import { runPreMatchPush } from "./scheduler/preMatchPushJob.js";

async function main() {
  logger.info("=== World Cup Telegram Predictor starting ===");

  // Init DB
  getDb();

  // Test Telegram connection
  const ok = await testConnection();
  if (!ok) {
    logger.error("Cannot connect to Telegram. Check TELEGRAM_BOT_TOKEN.");
    process.exit(1);
  }

  // Initial fixture sync
  await syncFixtures();

  // Schedule: sync fixtures every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      await syncFixtures();
    } catch (err) {
      logger.error({ err }, "Scheduled fixture sync failed");
    }
  });

  // Schedule: check pre-match push every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      await runPreMatchPush();
    } catch (err) {
      logger.error({ err }, "Pre-match push job failed");
    }
  });

  logger.info("Schedulers started:");
  logger.info("  - Fixture sync: every 6 hours");
  logger.info("  - Pre-match push: every 5 minutes");
  logger.info(`  - Timezone: ${config.timezone}`);
  logger.info(`  - Pre-match window: ${config.preMatchMinutes} minutes`);
  logger.info("=== System ready ===");
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
