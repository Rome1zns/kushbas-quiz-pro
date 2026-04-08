import type { Tables } from "@/integrations/supabase/types";

export type Game = Tables<"games">;
export type Player = Tables<"players">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;

export type QuizIndicator = 
  | "strategic_thinking"
  | "communication"
  | "teamwork"
  | "change_management"
  | "feedback";

export const INDICATOR_LABELS: Record<QuizIndicator, string> = {
  strategic_thinking: "Стратегиялық ойлау",
  communication: "Коммуникация",
  teamwork: "Командамен жұмыс",
  change_management: "Өзгерістерді басқару",
  feedback: "Кері байланыс беру",
};

export const ANSWER_COLORS = [
  { bg: "bg-quiz-red", hover: "hover:bg-quiz-red/80", icon: "triangle", label: "A" },
  { bg: "bg-quiz-blue", hover: "hover:bg-quiz-blue/80", icon: "diamond", label: "B" },
  { bg: "bg-quiz-yellow", hover: "hover:bg-quiz-yellow/80", icon: "circle", label: "C" },
  { bg: "bg-quiz-green", hover: "hover:bg-quiz-green/80", icon: "square", label: "D" },
];

export const TOTAL_QUIZ_SECONDS = 30;
export const MAX_SCORE_PER_QUESTION = 1000;
