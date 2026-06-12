import axios from "axios";
import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";
import { retry } from "../../utils/retry.js";

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string; // "h2h" | "spreads" | "totals"
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number; // handicap line or total line
}

export interface RawOddsEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

const SPORT_KEY = "soccer_fifa_world_cup";
const BASE_URL = "https://api.the-odds-api.com/v4";

export async function fetchOdds(
  markets: string[] = ["h2h", "spreads", "totals"]
): Promise<RawOddsEvent[]> {
  const apiKey = config.odds.apiKey;
  if (!apiKey) {
    logger.debug("No ODDS_API_KEY configured, skipping odds fetch");
    return [];
  }

  return retry(
    async () => {
      const resp = await axios.get<RawOddsEvent[]>(
        `${BASE_URL}/sports/${SPORT_KEY}/odds`,
        {
          params: {
            apiKey,
            regions: "eu",
            markets: markets.join(","),
            oddsFormat: "decimal",
          },
          timeout: 10_000,
        }
      );

      logger.info(
        `Odds API: fetched ${resp.data.length} events, remaining requests: ${resp.headers["x-requests-remaining"]}`
      );

      return resp.data;
    },
    "odds-api-fetch",
    2,
    3000
  );
}

export function findMatchOdds(
  events: RawOddsEvent[],
  homeTeam: string,
  awayTeam: string
): RawOddsEvent | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const h = normalize(homeTeam);
  const a = normalize(awayTeam);

  return events.find((e) => {
    const eh = normalize(e.home_team);
    const ea = normalize(e.away_team);
    return (eh.includes(h) || h.includes(eh)) && (ea.includes(a) || a.includes(ea));
  });
}
