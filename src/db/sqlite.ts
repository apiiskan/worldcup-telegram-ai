import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../data/worldcup.sqlite");

let _db: Database.Database;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema();
    logger.info(`SQLite initialized at ${DB_PATH}`);
  }
  return _db;
}

function initSchema() {
  _db.exec(`
    CREATE TABLE IF NOT EXISTS fixtures (
      id               TEXT PRIMARY KEY,
      home_team        TEXT NOT NULL,
      away_team        TEXT NOT NULL,
      kickoff_utc      TEXT NOT NULL,
      venue            TEXT DEFAULT '',
      city             TEXT DEFAULT '',
      stage            TEXT DEFAULT '',
      status           TEXT DEFAULT 'scheduled',
      home_score       INTEGER,
      away_score       INTEGER,
      home_rank        INTEGER,
      away_rank        INTEGER,
      raw_json         TEXT DEFAULT '{}',
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      fixture_id            TEXT NOT NULL REFERENCES fixtures(id),
      predicted_score       TEXT NOT NULL,
      winner                TEXT NOT NULL,
      confidence            REAL NOT NULL,
      risk_level            TEXT NOT NULL,
      over_under25          TEXT NOT NULL,
      both_teams_to_score   TEXT NOT NULL,
      upset_probability     TEXT NOT NULL,
      key_reasons_json      TEXT NOT NULL DEFAULT '[]',
      watch_points_json     TEXT NOT NULL DEFAULT '[]',
      raw_factors_json      TEXT NOT NULL DEFAULT '{}',
      created_at            TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_logs (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      fixture_id            TEXT NOT NULL,
      push_type             TEXT NOT NULL,
      event_id              TEXT DEFAULT '',
      telegram_message_id   INTEGER,
      status                TEXT DEFAULT 'sent',
      sent_at               TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON fixtures(kickoff_utc);
    CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
    CREATE INDEX IF NOT EXISTS idx_push_logs_fixture ON push_logs(fixture_id, push_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_push_logs_dedup ON push_logs(fixture_id, push_type, event_id);
  `);
}

export function closeDb() {
  if (_db) _db.close();
}
