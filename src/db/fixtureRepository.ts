import { getDb } from "./sqlite.js";
import type { NormalizedFixture } from "../skills/info-skill/normalizeFixture.js";

export function upsertFixture(f: NormalizedFixture) {
  getDb()
    .prepare(
      `INSERT INTO fixtures (id, home_team, away_team, kickoff_utc, venue, city, stage, status, home_score, away_score, home_rank, away_rank, raw_json, updated_at)
       VALUES (@id, @homeTeam, @awayTeam, @kickoffUtc, @venue, @city, @stage, @status, @homeScore, @awayScore, @homeRank, @awayRank, @rawJson, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         home_score = excluded.home_score,
         away_score = excluded.away_score,
         home_rank = COALESCE(excluded.home_rank, fixtures.home_rank),
         away_rank = COALESCE(excluded.away_rank, fixtures.away_rank),
         updated_at = datetime('now')`
    )
    .run({
      id: f.id,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      kickoffUtc: f.kickoffUtc,
      venue: f.venue ?? "",
      city: f.city ?? "",
      stage: f.stage ?? "",
      status: f.status,
      homeScore: f.score.home,
      awayScore: f.score.away,
      homeRank: f.homeRank ?? null,
      awayRank: f.awayRank ?? null,
      rawJson: JSON.stringify(f),
    });
}

export interface FixtureRow {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_utc: string;
  venue: string;
  city: string;
  stage: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_rank: number | null;
  away_rank: number | null;
}

export function getUpcomingUnpushed(withinMinutes: number): FixtureRow[] {
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() + withinMinutes * 60_000).toISOString();

  return getDb()
    .prepare(
      `SELECT f.* FROM fixtures f
       WHERE f.kickoff_utc > ? AND f.kickoff_utc <= ?
       AND f.status = 'scheduled'
       AND NOT EXISTS (
         SELECT 1 FROM push_logs p WHERE p.fixture_id = f.id AND p.push_type = 'pre_match'
       )
       ORDER BY f.kickoff_utc ASC`
    )
    .all(now, cutoff) as FixtureRow[];
}

export function getFixtureCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) as cnt FROM fixtures").get() as { cnt: number };
  return row.cnt;
}

export function getAllFixtures(): FixtureRow[] {
  return getDb().prepare("SELECT * FROM fixtures ORDER BY kickoff_utc ASC").all() as FixtureRow[];
}
