import axios from "axios";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const api = axios.create({
  baseURL: `https://api.telegram.org/bot${config.telegram.botToken}`,
  timeout: 15_000,
});

export async function sendMessage(text: string): Promise<number | undefined> {
  return retry(
    async () => {
      const res = await api.post("/sendMessage", {
        chat_id: config.telegram.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      const messageId = res.data?.result?.message_id;
      logger.info(`Telegram message sent (id: ${messageId})`);
      return messageId as number | undefined;
    },
    "telegram.sendMessage",
    3,
    3000
  );
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await api.get("/getMe");
    const botName = res.data?.result?.username;
    logger.info(`Telegram bot connected: @${botName}`);
    return true;
  } catch (err) {
    logger.error({ err }, "Telegram connection failed");
    return false;
  }
}
