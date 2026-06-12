import type { FixtureRow } from "../../db/fixtureRepository.js";
import { ruleBasedPredict } from "./ruleBasedPredictor.js";
import { aiEnhancePredict } from "./aiReasoningPredictor.js";
import { getOddsForMatch } from "../odds-skill/index.js";
import type { MarketOdds, MarketProbability, ValueResult } from "../odds-skill/index.js";
import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";

export type { MarketOdds, MarketProbability, ValueResult };

export interface PredictionResult {
  predictedScore: string;
  winner: "home" | "away" | "draw";
  confidence: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  overUnder25: "大2.5" | "小2.5" | "不确定";
  bothTeamsToScore: "是" | "否" | "不确定";
  upsetProbability: "低" | "中" | "高";
  keyReasons: string[];
  watchPoints: string[];
  recommendation: string;
  winProbability: { home: number; draw: number; away: number };
  recentForm: { home: string; away: string };
  formIndex: { home: number; away: number };
  elo: { home: number; away: number };
  aiAnalysis?: string;
  marketOdds?: MarketOdds;
  marketProb?: MarketProbability;
  valueIndex?: ValueResult;
  oddsSource?: "api" | "mock";
  rawFactors: {
    homeStrength: number;
    awayStrength: number;
    formGap: number;
    eloGap: number;
  };
}

export async function predictMatch(fixture: FixtureRow): Promise<PredictionResult> {
  const base = ruleBasedPredict(fixture);

  let result = base;

  if (config.ai.provider === "anthropic" && config.ai.anthropicKey) {
    try {
      result = await aiEnhancePredict(fixture, base);
    } catch (err) {
      logger.warn({ err }, "AI enhancement failed, using rule-based prediction");
    }
  }

  try {
    const oddsData = await getOddsForMatch(fixture, result.winProbability);
    result = {
      ...result,
      marketOdds: oddsData.odds,
      marketProb: oddsData.impliedProb,
      valueIndex: oddsData.value,
      oddsSource: oddsData.source,
    };

    if (oddsData.value.bestBet !== "none" && oddsData.value.bestValue >= 5) {
      const betLabel =
        oddsData.value.bestBet === "home" ? fixture.home_team :
        oddsData.value.bestBet === "away" ? fixture.away_team : "平局";
      result.keyReasons.push(
        `市场低估${betLabel}（模型 vs 市场差值 +${oddsData.value.bestValue.toFixed(1)}%），存在价值`
      );
    }
  } catch (err) {
    logger.warn({ err }, "Odds integration failed");
  }

  return result;
}
