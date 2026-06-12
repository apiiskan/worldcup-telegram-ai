import type { NormalizedFixture } from "./normalizeFixture.js";

export function loadMockFixtures(): NormalizedFixture[] {
  const groups: Record<string, [string, number][]> = {
    A: [["Mexico", 15], ["Japan", 18], ["Canada", 43], ["Ecuador", 33]],
    B: [["Portugal", 6], ["Netherlands", 7], ["Scotland", 39], ["Paraguay", 55]],
    C: [["Argentina", 1], ["Peru", 30], ["Egypt", 36], ["Uzbekistan", 62]],
    D: [["France", 2], ["Colombia", 12], ["Indonesia", 87], ["Bahrain", 81]],
    E: [["Brazil", 5], ["USA", 11], ["Bolivia", 79], ["New Zealand", 95]],
    F: [["England", 4], ["Denmark", 21], ["Panama", 44], ["Tunisia", 40]],
    G: [["Spain", 3], ["Turkey", 26], ["Poland", 28], ["Costa Rica", 48]],
    H: [["Germany", 8], ["Uruguay", 14], ["South Korea", 23], ["Serbia", 32]],
    I: [["Italy", 9], ["Croatia", 10], ["Cameroon", 50], ["Albania", 66]],
    J: [["Belgium", 3], ["Switzerland", 19], ["Saudi Arabia", 56], ["China", 70]],
    K: [["Senegal", 20], ["Morocco", 13], ["Australia", 24], ["Czech Republic", 36]],
    L: [["Nigeria", 28], ["Chile", 29], ["Iran", 22], ["Honduras", 75]],
  };

  const venues = [
    { name: "Estadio Azteca", city: "Mexico City" },
    { name: "Rose Bowl", city: "Pasadena" },
    { name: "MetLife Stadium", city: "New York/New Jersey" },
    { name: "AT&T Stadium", city: "Dallas" },
    { name: "SoFi Stadium", city: "Los Angeles" },
    { name: "Hard Rock Stadium", city: "Miami" },
    { name: "BMO Field", city: "Toronto" },
    { name: "Estadio BBVA", city: "Monterrey" },
    { name: "Estadio Akron", city: "Guadalajara" },
    { name: "Lumen Field", city: "Seattle" },
    { name: "Lincoln Financial Field", city: "Philadelphia" },
    { name: "NRG Stadium", city: "Houston" },
  ];

  const baseDate = new Date("2026-06-11T16:00:00Z");
  let fixtureId = 900001;
  const fixtures: NormalizedFixture[] = [];
  let dayOffset = 0;

  for (const [groupName, teams] of Object.entries(groups)) {
    const matchups: [number, number][] = [
      [0, 1], [2, 3],
      [0, 2], [1, 3],
      [0, 3], [1, 2],
    ];

    for (let m = 0; m < matchups.length; m++) {
      const [hi, ai] = matchups[m];
      const [homeTeam, homeRank] = teams[hi];
      const [awayTeam, awayRank] = teams[ai];
      const venue = venues[(fixtureId + m) % venues.length];
      const kickoff = new Date(
        baseDate.getTime() + dayOffset * 86_400_000 + (m % 3) * 3 * 3_600_000
      );

      fixtures.push({
        id: String(fixtureId++),
        homeTeam,
        awayTeam,
        kickoffUtc: kickoff.toISOString(),
        venue: venue.name,
        city: venue.city,
        stage: `Group ${groupName} - Matchday ${m < 2 ? 1 : m < 4 ? 2 : 3}`,
        status: "scheduled",
        score: { home: null, away: null },
        homeRank,
        awayRank,
        events: [],
      });

      if (m % 2 === 1) dayOffset++;
    }
  }

  return fixtures;
}
