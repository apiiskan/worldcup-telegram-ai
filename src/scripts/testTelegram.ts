import { testConnection, sendMessage } from "../telegram/telegramBot.js";
import { testMessage } from "../telegram/messageTemplates.js";
import { logger } from "../utils/logger.js";

async function main() {
  logger.info("Testing Telegram connection...");
  const ok = await testConnection();
  if (!ok) {
    logger.error("Connection failed. Check your TELEGRAM_BOT_TOKEN");
    process.exit(1);
  }

  logger.info("Sending test message...");
  const msgId = await sendMessage(testMessage());
  logger.info(`Test message sent! message_id: ${msgId}`);
}

main().catch(console.error);
