import axios from "axios";
import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";
import type { NormalizedFixture } from "./normalizeFixture.js";
import { normalizeStatus } from "./normalizeFixture.js";

const api = axios.create({
  baseURL: config.football.baseUrl,
  timeout: 15_000,
  headers: { "x-apisports-key": config.football.apiKey },
});

export async function fetchFixturesFromApi(): Promise<NormalizedFixture[]> {
  const res = await api.get("/fixtures", {
    params: {
      league: config.football.leagueId,
      season: config.football.season,
    },
  });

  const items = res.data?.response;
  if (!Array.isArray(items) || items.length === 0) {
    logger.warn("API-Football returned no fixtures");
    return [];
  }

  return items.map((item: Record<string, any>): NormalizedFixture => ({
    id: String(item.fixture.id),
    homeTeam: item.teams.home.name,
    awayTeam: item.teams.away.name,
    kickoffUtc: item.fixture.date,
    venue: item.fixture.venue?.name ?? "",
    city: item.fixture.venue?.city ?? "",
    stage: item.league.round ?? "",
    status: normalizeStatus(item.fixture.status.short),
    score: {
      home: item.goals.home ?? null,
      away: item.goals.away ?? null,
    },
    events: [],
  }));
}
