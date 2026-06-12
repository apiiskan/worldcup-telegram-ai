import type { FixtureRow } from "../../db/fixtureRepository.js";
import { fetchOdds, findMatchOdds } from "./oddsApiClient.js";
import { extractBestOdds, h2hToImpliedProbability } from "./impliedProbability.js";
import { calculateValueIndex } from "./valueIndex.js";
import { logger } from "../../utils/logger.js";
import type { MarketOdds, MarketProbability } from "./impliedProbability.js";
import type { ValueResult } from "./valueIndex.js";

export type { MarketOdds, MarketProbability, ValueResult };

export interface OddsData {
  odds: MarketOdds;
  impliedProb: MarketProbability;
  value: ValueResult;
  source: "api" | "mock";
}

const MOCK_ODDS: Record<string, MarketOdds> = {};

function mockOddsForFixture(
  _fixture: FixtureRow,
  modelProb: { home: number; draw: number; away: number }
): MarketOdds {
  const noise = () => (Math.random() - 0.5) * 12;
  const hp = Math.max(5, modelProb.home + noise());
  const dp = Math.max(5, modelProb.draw + noise());
  const ap = Math.max(5, modelProb.away + noise());
  const sum = hp + dp + ap;
  const margin = 1.06;
  return {
    h2h: {
      home: Math.round((sum / hp) * margin * 100) / 100,
      draw: Math.round((sum / dp) * margin * 100) / 100,
      away: Math.round((sum / ap) * margin * 100) / 100,
    },
    spread: { line: -0.5, home: 1.85, away: 2.05 },
    total: { line: 2.5, over: 1.90, under: 1.95 },
  };
}

export async function getOddsForMatch(
  fixture: FixtureRow,
  modelProb: { home: number; draw: number; away: number }
): Promise<OddsData> {
  try {
    const events = await fetchOdds();

    if (events.length > 0) {
      const match = findMatchOdds(events, fixture.home_team, fixture.away_team);

      if (match && match.bookmakers.length > 0) {
        const odds = extractBestOdds(match.bookmakers, match.home_team);

        if (odds.h2h) {
          const impliedProb = h2hToImpliedProbability(
            odds.h2h.home,
            odds.h2h.draw,
            odds.h2h.away
          );
          const value = calculateValueIndex(modelProb, impliedProb);

          logger.info(
            { home: fixture.home_team, away: fixture.away_team, odds: odds.h2h },
            "Live odds fetched"
          );

          return { odds, impliedProb, value, source: "api" };
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "Odds API fetch failed, using mock odds");
  }

  const odds = MOCK_ODDS[fixture.id] ?? mockOddsForFixture(fixture, modelProb);
  MOCK_ODDS[fixture.id] = odds;

  const impliedProb = odds.h2h
    ? h2hToImpliedProbability(odds.h2h.home, odds.h2h.draw, odds.h2h.away)
    : { home: modelProb.home, draw: modelProb.draw, away: modelProb.away };

  const value = calculateValueIndex(modelProb, impliedProb);

  return { odds, impliedProb, value, source: "mock" };
}
