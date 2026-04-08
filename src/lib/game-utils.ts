import { MAX_SCORE_PER_QUESTION, TOTAL_QUIZ_SECONDS } from "./game-types";

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculateScore(timeRemainingMs: number, questionWindowMs: number): number {
  const timeRatio = Math.max(0, timeRemainingMs) / questionWindowMs;
  return Math.round(MAX_SCORE_PER_QUESTION * timeRatio);
}
