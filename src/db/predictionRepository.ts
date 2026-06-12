import { getDb } from "./sqlite.js";
import type { PredictionResult } from "../skills/prediction-skill/index.js";

export function savePrediction(fixtureId: string, p: PredictionResult) {
  getDb()
    .prepare(
      `INSERT INTO predictions
       (fixture_id, predicted_score, winner, confidence, risk_level, over_under25, both_teams_to_score, upset_probability, key_reasons_json, watch_points_json, raw_factors_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      fixtureId,
      p.predictedScore,
      p.winner,
      p.confidence,
      String(p.riskLevel),
      p.overUnder25,
      p.bothTeamsToScore,
      p.upsetProbability,
      JSON.stringify(p.keyReasons),
      JSON.stringify(p.watchPoints),
      JSON.stringify(p.rawFactors)
    );
}
