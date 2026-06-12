import type { FixtureRow } from "../../db/fixtureRepository.js";
import type { PredictionResult } from "./index.js";
import { getElo, eloProbabilities } from "./eloRatings.js";
import { getFormData } from "./formTracker.js";

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function ruleBasedPredict(fixture: FixtureRow): PredictionResult {
  const homeElo = getElo(fixture.home_team);
  const awayElo = getElo(fixture.away_team);
  const homeForm = getFormData(fixture.home_team);
  const awayForm = getFormData(fixture.away_team);

  // --- Step 1: ELO-based probabilities (70% weight) ---
  const eloProb = eloProbabilities(homeElo, awayElo);

  // --- Step 2: Form adjustment (30% weight) ---
  // Form index 0-100 maps to a slight shift
  const formDiff = (homeForm.index - awayForm.index) / 100; // -1 to +1
  const formShiftHome = Math.round(formDiff * 8);
  const formShiftAway = -formShiftHome;

  let homeProb = clamp(Math.round(eloProb.home * 0.7 + (eloProb.home + formShiftHome) * 0.3), 5, 85);
  let awayProb = clamp(Math.round(eloProb.away * 0.7 + (eloProb.away + formShiftAway) * 0.3), 5, 85);
  let drawProb = 100 - homeProb - awayProb;

  // Clamp draw and re-normalize if needed
  if (drawProb < 10) {
    drawProb = 10;
    const total = homeProb + awayProb;
    homeProb = Math.round((homeProb / total) * 90);
    awayProb = 90 - homeProb;
  }
  if (drawProb > 40) {
    drawProb = 40;
    const remainder = 60;
    const ratio = homeProb / (homeProb + awayProb || 1);
    homeProb = Math.round(ratio * remainder);
    awayProb = remainder - homeProb;
  }

  // Final guarantee: sum = 100
  const sum = homeProb + drawProb + awayProb;
  if (sum !== 100) {
    homeProb += 100 - sum;
  }

  // --- Step 3: Winner & confidence ---
  let winner: "home" | "away" | "draw";
  let confidence: number;

  if (homeProb > awayProb && homeProb > drawProb) {
    winner = "home";
    confidence = homeProb / 100;
  } else if (awayProb > homeProb && awayProb > drawProb) {
    winner = "away";
    confidence = awayProb / 100;
  } else {
    winner = "draw";
    confidence = drawProb / 100;
  }
  confidence = clamp(confidence, 0.2, 0.85);

  // --- Step 4: Score prediction ---
  const eloGap = homeElo - awayElo;
  const absGap = Math.abs(eloGap);
  const strongerIsHome = eloGap >= 0;

  let sGoals: number; // stronger team goals
  let wGoals: number; // weaker team goals

  if (absGap > 400) {
    sGoals = 3; wGoals = 0;
  } else if (absGap > 250) {
    sGoals = 2; wGoals = 0;
  } else if (absGap > 150) {
    sGoals = 2; wGoals = 1;
  } else if (absGap > 80) {
    sGoals = 1; wGoals = 0;
  } else {
    sGoals = 1; wGoals = 1;
  }

  const homeGoals = strongerIsHome ? sGoals : wGoals;
  const awayGoals = strongerIsHome ? wGoals : sGoals;
  const totalGoals = homeGoals + awayGoals;

  // --- Step 5: Risk level (1-5 stars) ---
  let riskLevel: 1 | 2 | 3 | 4 | 5;
  if (confidence >= 0.65) riskLevel = 1;
  else if (confidence >= 0.55) riskLevel = 2;
  else if (confidence >= 0.45) riskLevel = 3;
  else if (confidence >= 0.35) riskLevel = 4;
  else riskLevel = 5;

  // --- Step 6: Over/under, BTTS, upset ---
  const isKnockout =
    fixture.stage?.toLowerCase().includes("round of") ||
    fixture.stage?.toLowerCase().includes("quarter") ||
    fixture.stage?.toLowerCase().includes("semi") ||
    fixture.stage?.toLowerCase().includes("final");

  let overUnder25: "大2.5" | "小2.5" | "不确定";
  if (totalGoals >= 3) overUnder25 = "大2.5";
  else if (totalGoals <= 1) overUnder25 = "小2.5";
  else if (isKnockout) overUnder25 = "小2.5";
  else overUnder25 = absGap > 100 ? "小2.5" : "不确定";

  let bothTeamsToScore: "是" | "否" | "不确定";
  if (homeGoals > 0 && awayGoals > 0) bothTeamsToScore = "是";
  else if (absGap > 300) bothTeamsToScore = "否";
  else bothTeamsToScore = "不确定";

  let upsetProbability: "低" | "中" | "高";
  if (absGap > 250) upsetProbability = "低";
  else if (absGap > 100) upsetProbability = "中";
  else upsetProbability = "高";

  // --- Step 7: Reasons & watch points ---
  const homeLabel = fixture.home_team;
  const awayLabel = fixture.away_team;
  const stronger = strongerIsHome ? homeLabel : awayLabel;
  const weaker = strongerIsHome ? awayLabel : homeLabel;
  const keyReasons: string[] = [];

  if (absGap > 200) {
    keyReasons.push(`${stronger} ELO评分远超 ${weaker}（${Math.max(homeElo, awayElo)} vs ${Math.min(homeElo, awayElo)}），实力碾压`);
  } else if (absGap > 80) {
    keyReasons.push(`${stronger} ELO评分领先 ${weaker} ${absGap}分，有明显优势`);
  } else {
    keyReasons.push(`两队ELO评分接近（${homeElo} vs ${awayElo}），势均力敌`);
  }

  const formGap = homeForm.index - awayForm.index;
  if (Math.abs(formGap) > 20) {
    const hotTeam = formGap > 0 ? homeLabel : awayLabel;
    keyReasons.push(`${hotTeam} 近期状态明显更好，状态指数领先${Math.abs(formGap)}点`);
  } else {
    keyReasons.push("两队近期状态相近，无明显士气差距");
  }

  if (isKnockout) {
    keyReasons.push("淘汰赛阶段，强队稳定性更高，但弱队拼劲十足");
  } else {
    keyReasons.push("小组赛首轮/次轮，球队策略偏保守试探");
  }

  const watchPoints: string[] = [];
  if (absGap < 120) {
    watchPoints.push("开局15分钟的节奏控制和首粒进球至关重要");
  } else {
    watchPoints.push(`${weaker} 的防守纪律性和反击效率`);
  }
  watchPoints.push(isKnockout ? "点球大战心理素质" : "换人调整和体能分配");

  // --- Step 8: Recommendation ---
  let recommendation: string;
  if (winner === "draw") {
    recommendation = "双方不分胜负";
  } else {
    const winTeam = winner === "home" ? homeLabel : awayLabel;
    const winProb = winner === "home" ? homeProb : awayProb;
    const notLoseProb = winner === "home" ? homeProb + drawProb : awayProb + drawProb;

    if (winProb >= 50) {
      recommendation = `${winTeam}胜`;
    } else if (notLoseProb >= 60) {
      recommendation = `${winTeam}不败`;
    } else {
      recommendation = `${winTeam}小胜或平局`;
    }
  }

  return {
    predictedScore: `${homeGoals}-${awayGoals}`,
    winner,
    confidence: Math.round(confidence * 100) / 100,
    riskLevel,
    overUnder25,
    bothTeamsToScore,
    upsetProbability,
    keyReasons,
    watchPoints,
    recommendation,
    winProbability: { home: homeProb, draw: drawProb, away: awayProb },
    recentForm: { home: homeForm.last5, away: awayForm.last5 },
    formIndex: { home: homeForm.index, away: awayForm.index },
    elo: { home: homeElo, away: awayElo },
    rawFactors: {
      homeStrength: homeElo,
      awayStrength: awayElo,
      formGap,
      eloGap,
    },
  };
}
