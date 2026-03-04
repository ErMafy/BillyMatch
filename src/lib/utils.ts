import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function generateChecksum(
  playedAt: Date,
  winnerTeamId: string,
  winnerScore: number,
  loserScore: number,
  mode: string
): string {
  const roundedMinute = new Date(playedAt);
  roundedMinute.setSeconds(0, 0);
  const raw = `${roundedMinute.toISOString()}|${winnerTeamId}|${winnerScore}|${loserScore}|${mode}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
