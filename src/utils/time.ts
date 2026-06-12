export function minutesUntil(utcIso: string): number {
  return (new Date(utcIso).getTime() - Date.now()) / 60_000;
}

export function formatKickoff(utcIso: string, tz: string): string {
  return new Date(utcIso).toLocaleString("zh-CN", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatCountdown(minutes: number): string {
  if (minutes < 1) return "即将开始";
  if (minutes < 60) return `约 ${Math.round(minutes)} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `约 ${h} 小时 ${m} 分钟` : `约 ${h} 小时`;
}
