import type { FixtureRow } from "../db/fixtureRepository.js";
import type { PredictionResult } from "../skills/prediction-skill/index.js";
import { formatKickoff, formatCountdown, minutesUntil } from "../utils/time.js";
import { config } from "../config.js";

const FLAGS: Record<string, string> = {
  Argentina: "\u{1F1E6}\u{1F1F7}", France: "\u{1F1EB}\u{1F1F7}", Spain: "\u{1F1EA}\u{1F1F8}",
  Brazil: "\u{1F1E7}\u{1F1F7}", England: "\u{1F1EC}\u{1F1E7}", Germany: "\u{1F1E9}\u{1F1EA}",
  Netherlands: "\u{1F1F3}\u{1F1F1}", Portugal: "\u{1F1F5}\u{1F1F9}", Belgium: "\u{1F1E7}\u{1F1EA}",
  Italy: "\u{1F1EE}\u{1F1F9}", Colombia: "\u{1F1E8}\u{1F1F4}", Croatia: "\u{1F1ED}\u{1F1F7}",
  Uruguay: "\u{1F1FA}\u{1F1FE}", USA: "\u{1F1FA}\u{1F1F8}", Mexico: "\u{1F1F2}\u{1F1FD}",
  Morocco: "\u{1F1F2}\u{1F1E6}", Japan: "\u{1F1EF}\u{1F1F5}", Switzerland: "\u{1F1E8}\u{1F1ED}",
  Denmark: "\u{1F1E9}\u{1F1F0}", Senegal: "\u{1F1F8}\u{1F1F3}", Iran: "\u{1F1EE}\u{1F1F7}",
  "South Korea": "\u{1F1F0}\u{1F1F7}", Australia: "\u{1F1E6}\u{1F1FA}", Turkey: "\u{1F1F9}\u{1F1F7}",
  Poland: "\u{1F1F5}\u{1F1F1}", Nigeria: "\u{1F1F3}\u{1F1EC}", Chile: "\u{1F1E8}\u{1F1F1}",
  Peru: "\u{1F1F5}\u{1F1EA}", Serbia: "\u{1F1F7}\u{1F1F8}", Ecuador: "\u{1F1EA}\u{1F1E8}",
  "Czech Republic": "\u{1F1E8}\u{1F1FF}", Egypt: "\u{1F1EA}\u{1F1EC}", Scotland: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  Tunisia: "\u{1F1F9}\u{1F1F3}", Canada: "\u{1F1E8}\u{1F1E6}", Panama: "\u{1F1F5}\u{1F1E6}",
  "Costa Rica": "\u{1F1E8}\u{1F1F7}", Cameroon: "\u{1F1E8}\u{1F1F2}", Paraguay: "\u{1F1F5}\u{1F1FE}",
  "Saudi Arabia": "\u{1F1F8}\u{1F1E6}", Uzbekistan: "\u{1F1FA}\u{1F1FF}", Albania: "\u{1F1E6}\u{1F1F1}",
  China: "\u{1F1E8}\u{1F1F3}", Honduras: "\u{1F1ED}\u{1F1F3}", Bolivia: "\u{1F1E7}\u{1F1F4}",
  Indonesia: "\u{1F1EE}\u{1F1E9}", Bahrain: "\u{1F1E7}\u{1F1ED}", "New Zealand": "\u{1F1F3}\u{1F1FF}",
  Qatar: "\u{1F1F6}\u{1F1E6}", "Bosnia & Herzegovina": "\u{1F1E7}\u{1F1E6}",
};

function flag(team: string): string {
  return FLAGS[team] ?? "\u{1F3F3}\u{FE0F}";
}

function stars(level: number): string {
  return "\u{2B50}".repeat(level);
}

function riskLabel(level: number): string {
  if (level <= 2) return "\u{1F7E2} 低风险";
  if (level <= 3) return "\u{1F7E1} 中风险";
  return "\u{1F534} 高风险";
}

function formDots(form: string): string {
  return form
    .split(" ")
    .map((ch) => {
      if (ch === "W") return "\u{1F7E2}";
      if (ch === "D") return "\u{1F7E1}";
      if (ch === "L") return "\u{1F534}";
      return "\u{26AA}";
    })
    .join("");
}

function valueBadge(val: number): string {
  if (val >= 10) return "\u{1F4A5} 超级价值";
  if (val >= 5) return "\u{1F525} 高价值";
  if (val >= 2) return "\u{2705} 有价值";
  return "\u{26AA} 一般";
}

function signedPct(v: number): string {
  return v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`;
}

export function preMatchMessage(fixture: FixtureRow, p: PredictionResult): string {
  const kickoff = formatKickoff(fixture.kickoff_utc, config.timezone);
  const countdown = formatCountdown(minutesUntil(fixture.kickoff_utc));
  const wp = p.winProbability;
  const [hGoals, aGoals] = p.predictedScore.split("-");

  let oddsSection = "";
  if (p.marketOdds?.h2h) {
    const o = p.marketOdds.h2h;
    const spreadLine = p.marketOdds.spread
      ? `\n\u{25B8} 亚盘\u{FF1A}${p.marketOdds.spread.line > 0 ? "+" : ""}${p.marketOdds.spread.line} @ ${p.marketOdds.spread.home}/${p.marketOdds.spread.away}`
      : "";
    const totalLine = p.marketOdds.total
      ? `\n\u{25B8} 大小球\u{FF1A}${p.marketOdds.total.line} @ ${p.marketOdds.total.over}/${p.marketOdds.total.under}`
      : "";
    oddsSection = `
\u{1F4C8} <b>市场赔率</b>${p.oddsSource === "mock" ? " <i>(模拟)</i>" : ""}
\u{25B8} 1X2\u{FF1A}${o.home} / ${o.draw} / ${o.away}${spreadLine}${totalLine}
`;
  }

  let modelVsMarket = "";
  if (p.marketProb) {
    const mp = p.marketProb;
    modelVsMarket = `
\u{1F4CA} <b>模型 vs 市场</b>
${flag(fixture.home_team)} ${fixture.home_team}
  模型 <b>${wp.home}%</b> \u{FF5C} 市场 <b>${mp.home}%</b>
${flag(fixture.away_team)} ${fixture.away_team}
  模型 <b>${wp.away}%</b> \u{FF5C} 市场 <b>${mp.away}%</b>
\u{1F91D} 平局
  模型 <b>${wp.draw}%</b> \u{FF5C} 市场 <b>${mp.draw}%</b>
`;
  }

  let valueSection = "";
  if (p.valueIndex && p.marketProb) {
    const v = p.valueIndex;
    const bestLabel =
      v.bestBet === "home" ? fixture.home_team :
      v.bestBet === "away" ? fixture.away_team :
      v.bestBet === "draw" ? "平局" : "—";

    valueSection = `
\u{1F525} <b>价值指数</b>
${flag(fixture.home_team)} ${fixture.home_team}\u{FF1A}${signedPct(v.homeValue)}
\u{1F91D} 平局\u{FF1A}${signedPct(v.drawValue)}
${flag(fixture.away_team)} ${fixture.away_team}\u{FF1A}${signedPct(v.awayValue)}

${v.bestBet !== "none" ? `\u{1F3AF} 最佳价值\u{FF1A}<b>${bestLabel}</b> ${signedPct(v.bestValue)}` : "\u{26AA} 无明显价值差"}
\u{2B50} 评级\u{FF1A}${stars(v.rating)} ${valueBadge(v.bestValue)}
`;
  }

  return `\u{1F3C6} <b>世界杯赛前预测</b>

${flag(fixture.home_team)} <b>${fixture.home_team}</b>  VS  <b>${fixture.away_team}</b> ${flag(fixture.away_team)}

\u{1F4C5} ${kickoff}  \u{23F3} ${countdown}
\u{1F3DF}\u{FE0F} ${fixture.venue || "TBD"}\u{00B7}${fixture.city || ""}
\u{1F3F7}\u{FE0F} ${fixture.stage || "Group Stage"}

\u{26BD} <b>预测比分</b>
<code>    ${hGoals}  :  ${aGoals}</code>
${oddsSection}${modelVsMarket}${valueSection}
\u{1F525} <b>风险等级</b>
${riskLabel(p.riskLevel)}

\u{1F4C8} <b>近5场状态</b>
${fixture.home_team}
${formDots(p.recentForm.home)}
${p.formIndex.home}/100

${fixture.away_team}
${formDots(p.recentForm.away)}
${p.formIndex.away}/100

\u{1F3AF} <b>推荐方向</b>
${p.recommendation}

\u{1F9E9} <b>细分</b>
\u{25B8} 大小球\u{FF1A}${p.overUnder25}
\u{25B8} 双方进球\u{FF1A}${p.bothTeamsToScore}
\u{25B8} 冷门概率\u{FF1A}${p.upsetProbability}

\u{1F916} <b>AI分析</b>
${p.aiAnalysis || p.keyReasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}

\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}

<i>仅供参考，不保证命中。</i>`;
}

export function testMessage(): string {
  return `\u{1F6A8} <b>世界杯预测系统 \u{00B7} 连接测试</b>

\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}

\u{2705} Telegram Bot 连接正常
\u{2705} 消息推送正常
\u{2705} 数据库就绪
\u{2705} ELO 评分系统就绪

\u{1F3C6} 2026 FIFA World Cup
\u{1F30E} 美国 \u{00B7} 加拿大 \u{00B7} 墨西哥

<i>系统已就绪，等待开赛！</i>`;
}
