import { useState, useEffect, useMemo } from "react";
import { Crown } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { INDICATOR_LABELS, MAX_SCORE_PER_QUESTION, type QuizIndicator } from "@/lib/game-types";
import type { Question, Answer, Player } from "@/lib/game-types";

interface Props {
  gameId: string;
  playerId: string;
  questions: Question[];
}

const PlayerResults = ({ gameId, playerId, questions }: Props) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [rank, setRank] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Player info
    const { data: p } = await supabase.from("players").select().eq("id", playerId).single();
    if (p) setPlayer(p);

    // All answers for this player
    const { data: a } = await supabase.from("answers").select().eq("player_id", playerId);
    if (a) setAnswers(a);

    // Ranking
    const { data: allPlayers } = await supabase
      .from("players")
      .select()
      .eq("game_id", gameId)
      .order("total_score", { ascending: false });
    if (allPlayers) {
      setTotalPlayers(allPlayers.length);
      const idx = allPlayers.findIndex((pl) => pl.id === playerId);
      setRank(idx + 1);
    }
  };

  // Calculate per-indicator scores (1-5 scale)
  const indicatorScores = useMemo(() => {
    const scores: Record<string, { earned: number; max: number }> = {};
    for (const q of questions) {
      if (!scores[q.indicator]) scores[q.indicator] = { earned: 0, max: 0 };
      scores[q.indicator].max += MAX_SCORE_PER_QUESTION;
    }
    for (const a of answers) {
      const q = questions.find((q) => q.id === a.question_id);
      if (q) scores[q.indicator].earned += a.score_earned;
    }
    return Object.entries(scores).map(([key, val]) => ({
      indicator: key as QuizIndicator,
      label: INDICATOR_LABELS[key as QuizIndicator],
      score: val.max > 0 ? Math.round((val.earned / val.max) * 5 * 10) / 10 : 0,
      fullMark: 5,
    }));
  }, [questions, answers]);

  const sorted = [...indicatorScores].sort((a, b) => b.score - a.score);
  const top2 = sorted.slice(0, 2);
  const weakest = sorted[sorted.length - 1];

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <Crown className="mx-auto mb-2 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Сіздің пікіріңіз</h1>
        </div>

        {/* Score card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
          <p className="text-5xl font-extrabold text-primary">{player.total_score}</p>
          <p className="text-muted-foreground">ұпай</p>
          <p className="mt-2 text-lg font-semibold">
            {rank}-орын / {totalPlayers} қатысушы
          </p>
        </div>

        {/* Radar chart */}
        <div className="mb-6 rounded-2xl bg-card p-4">
          <h3 className="mb-2 text-center font-semibold">Құзыреттер профилі</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={indicatorScores}>
              <PolarGrid stroke="hsl(230, 25%, 25%)" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(45, 100%, 96%)" }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(230, 15%, 60%)" }} />
              <Radar
                name="Балл"
                dataKey="score"
                stroke="hsl(38, 92%, 55%)"
                fill="hsl(38, 92%, 55%)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scores breakdown */}
        <div className="mb-6 rounded-2xl bg-card p-4 space-y-2">
          {indicatorScores.map((s) => (
            <div key={s.indicator} className="flex items-center justify-between">
              <span className="text-sm">{s.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(s.score / 5) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-bold text-primary">{s.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Personal insight - opinion-based messaging */}
        <div className="rounded-2xl bg-card p-4">
          <p className="text-sm leading-relaxed">
            Сіз бұл бағыттарда білсендісіз:{" "}
            <strong className="text-primary">{top2[0]?.label}</strong>
            {top2[1] && (
              <>
                {" "}және <strong className="text-primary">{top2[1]?.label}</strong>
              </>
            )}
            . Осы бағытта тереңдете аласыз:{" "}
            <strong className="text-destructive">{weakest?.label}</strong>.
          </p>
          <p className="mt-3 rounded-lg bg-secondary p-3 text-sm italic">
            «Мен өз басқарушылық қызметімде{" "}
            <strong>{weakest?.label}</strong> бағытында өндіктіме назар аударамын.»
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerResults;
