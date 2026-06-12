export interface NormalizedFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  venue?: string;
  city?: string;
  stage?: string;
  status: "scheduled" | "live" | "halftime" | "finished" | "postponed";
  score: { home: number | null; away: number | null };
  homeRank?: number;
  awayRank?: number;
  events: NormalizedEvent[];
}

export interface NormalizedEvent {
  id: string;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "period";
  minute?: number;
  team?: string;
  player?: string;
  detail?: string;
}

const STATUS_MAP: Record<string, NormalizedFixture["status"]> = {
  NS: "scheduled",
  TBD: "scheduled",
  "1H": "live",
  "2H": "live",
  LIVE: "live",
  ET: "live",
  BT: "live",
  P: "live",
  HT: "halftime",
  FT: "finished",
  AET: "finished",
  PEN: "finished",
  PST: "postponed",
  CANC: "postponed",
  scheduled: "scheduled",
  live: "live",
  halftime: "halftime",
  finished: "finished",
  postponed: "postponed",
};

export function normalizeStatus(raw: string): NormalizedFixture["status"] {
  return STATUS_MAP[raw] ?? "scheduled";
}
