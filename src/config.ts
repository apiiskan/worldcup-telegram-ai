import "dotenv/config";

function env(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing env var: ${key}`);
  return val;
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (!val) return fallback;
  return val === "true" || val === "1";
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

export const config = {
  telegram: {
    botToken: env("TELEGRAM_BOT_TOKEN", ""),
    chatId: env("TELEGRAM_CHAT_ID", ""),
  },
  football: {
    provider: env("FOOTBALL_API_PROVIDER", "mock"),
    apiKey: env("FOOTBALL_API_KEY", ""),
    baseUrl: env("FOOTBALL_API_BASE_URL", "https://v3.football.api-sports.io"),
    leagueId: envInt("WORLD_CUP_LEAGUE_ID", 1),
    season: envInt("WORLD_CUP_SEASON", 2026),
  },
  ai: {
    provider: env("AI_PROVIDER", "none") as "openai" | "anthropic" | "gemini" | "none",
    openaiKey: env("OPENAI_API_KEY", ""),
    anthropicKey: env("ANTHROPIC_API_KEY", ""),
    geminiKey: env("GEMINI_API_KEY", ""),
  },
  odds: {
    apiKey: env("ODDS_API_KEY", ""),
    provider: env("ODDS_PROVIDER", "mock") as "api" | "mock",
  },
  timezone: env("TIMEZONE", "America/Los_Angeles"),
  preMatchMinutes: envInt("PRE_MATCH_MINUTES", 60),
  enableLiveScore: envBool("ENABLE_LIVE_SCORE", false),
  enablePostMatchReview: envBool("ENABLE_POST_MATCH_REVIEW", false),
  logLevel: env("LOG_LEVEL", "info"),
};
