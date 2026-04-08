import { MAX_SCORE_PER_QUESTION, QUESTION_TIME_SECONDS } from "./game-types";

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculateScore(timeRemainingMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, timeRemainingMs) / (QUESTION_TIME_SECONDS * 1000);
  return Math.round(MAX_SCORE_PER_QUESTION * timeRatio);
}
