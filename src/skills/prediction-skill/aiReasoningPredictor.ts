import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";
import type { FixtureRow } from "../../db/fixtureRepository.js";
import type { PredictionResult } from "./index.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.ai.anthropicKey });
  }
  return client;
}

export async function aiEnhancePredict(
  fixture: FixtureRow,
  base: PredictionResult
): Promise<PredictionResult> {
  const prompt = `你是一个专业足球分析师。请基于以下信息，给出比赛预测分析。

比赛信息：
- 主队：${fixture.home_team}（ELO ${base.elo.home}，FIFA排名 #${fixture.home_rank ?? "未知"}）
- 客队：${fixture.away_team}（ELO ${base.elo.away}，FIFA排名 #${fixture.away_rank ?? "未知"}）
- 阶段：${fixture.stage || "小组赛"}
- 场地：${fixture.venue || "中立场"}，${fixture.city || ""}

主队近5场：${base.recentForm.home}（状态指数 ${base.formIndex.home}/100）
客队近5场：${base.recentForm.away}（状态指数 ${base.formIndex.away}/100）

ELO模型预测：
- 预测比分：${base.predictedScore}
- 胜率：主${base.winProbability.home}% / 平${base.winProbability.draw}% / 客${base.winProbability.away}%
- 推荐：${base.recommendation}

请你在此基础上优化分析，返回严格 JSON 格式（不要 markdown 代码块），包含：
{
  "predictedScore": "X-X",
  "winner": "home" | "away" | "draw",
  "confidence": 0.XX,
  "riskLevel": 1到5的整数(1最稳5最冷),
  "overUnder25": "大2.5" | "小2.5" | "不确定",
  "bothTeamsToScore": "是" | "否" | "不确定",
  "upsetProbability": "低" | "中" | "高",
  "winProbability": { "home": XX, "draw": XX, "away": XX },
  "recommendation": "一句话推荐方向，如'Argentina不败'或'小球+主队胜'",
  "keyReasons": ["理由1", "理由2", "理由3"],
  "watchPoints": ["看点1", "看点2"],
  "aiAnalysis": "2-3句话的专业比赛分析，引用具体球队战术特点"
}

要求：
1. winProbability 三项加起来必须等于100
2. keyReasons 要具体，不要空泛
3. aiAnalysis 是给用户看的分析段落，不要重复 keyReasons`;

  logger.info("Calling Claude API for match analysis...");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...base,
      predictedScore: parsed.predictedScore ?? base.predictedScore,
      winner: parsed.winner ?? base.winner,
      confidence: parsed.confidence ?? base.confidence,
      riskLevel: parsed.riskLevel ?? base.riskLevel,
      overUnder25: parsed.overUnder25 ?? base.overUnder25,
      bothTeamsToScore: parsed.bothTeamsToScore ?? base.bothTeamsToScore,
      upsetProbability: parsed.upsetProbability ?? base.upsetProbability,
      keyReasons: parsed.keyReasons ?? base.keyReasons,
      watchPoints: parsed.watchPoints ?? base.watchPoints,
      recommendation: parsed.recommendation ?? base.recommendation,
      winProbability: parsed.winProbability ?? base.winProbability,
      aiAnalysis: parsed.aiAnalysis ?? undefined,
    };
  } catch (parseErr) {
    logger.warn({ parseErr, text }, "Failed to parse AI response, using rule-based");
    return base;
  }
}
