import { getDb } from "./sqlite.js";

export function hasPushed(fixtureId: string, pushType: string, eventId = ""): boolean {
  const row = getDb()
    .prepare(
      `SELECT 1 FROM push_logs WHERE fixture_id = ? AND push_type = ? AND event_id = ? LIMIT 1`
    )
    .get(fixtureId, pushType, eventId);
  return !!row;
}

export function logPush(
  fixtureId: string,
  pushType: string,
  telegramMessageId?: number,
  eventId = ""
) {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO push_logs (fixture_id, push_type, event_id, telegram_message_id)
       VALUES (?, ?, ?, ?)`
    )
    .run(fixtureId, pushType, eventId, telegramMessageId ?? null);
}
