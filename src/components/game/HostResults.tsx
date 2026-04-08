import { useEffect, useMemo } from "react";
import { Crown, Trophy } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import confetti from "canvas-confetti";
import { INDICATOR_LABELS, type QuizIndicator } from "@/lib/game-types";
import type { Player, Question, Answer } from "@/lib/game-types";

interface Props {
  gameId: string;
  players: Player[];
  questions: Question[];
  answers: Answer[];
}

const HostResults = ({ gameId, players, questions, answers }: Props) => {
  useEffect(() => {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
  }, []);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.total_score - a.total_score),
    [players]
  );

  // Calculate group averages per indicator
  const groupAverages = useMemo(() => {
    const indicatorScores: Record<string, { total: number; count: number }> = {};
    for (const q of questions) {
      if (!indicatorScores[q.indicator]) {
        indicatorScores[q.indicator] = { total: 0, count: 0 };
      }
    }
    for (const a of answers) {
      const q = questions.find((q) => q.id === a.question_id);
      if (q) {
        indicatorScores[q.indicator].total += a.score_earned;
        indicatorScores[q.indicator].count += 1;
      }
    }
    return Object.entries(indicatorScores).map(([key, val]) => ({
      indicator: key,
      label: INDICATOR_LABELS[key as QuizIndicator],
      avg: val.count > 0 ? Math.round(val.total / val.count) : 0,
    }));
  }, [questions, answers]);

  const strongest = [...groupAverages].sort((a, b) => b.avg - a.avg)[0];
  const weakest = [...groupAverages].sort((a, b) => a.avg - b.avg)[0];

  const barColors = ["hsl(38, 92%, 55%)", "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(45, 93%, 58%)"];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Crown className="mx-auto mb-2 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-extrabold">🏆 Нәтижелер</h1>
        </div>

        {/* Winner */}
        {sortedPlayers[0] && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 text-center">
            <Trophy className="mx-auto mb-3 h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold">{sortedPlayers[0].name}</h2>
            <p className="text-muted-foreground">{sortedPlayers[0].school}</p>
            <p className="mt-2 text-4xl font-extrabold text-primary">
              {sortedPlayers[0].total_score} ұпай
            </p>
          </div>
        )}

        {/* Top 10 */}
        <div className="mb-8 rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-xl font-bold">ТОП-10 Көшбасшылар</h3>
          <div className="space-y-2">
            {sortedPlayers.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  i === 0 ? "bg-primary/10" : "bg-secondary/50"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span className="font-semibold">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.school}</span>
                </div>
                <span className="font-bold text-primary">{p.total_score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group averages bar chart */}
        <div className="mb-8 rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-xl font-bold">Топтың орташа көрсеткіштері</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupAverages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 25%)" />
              <XAxis type="number" stroke="hsl(230, 15%, 60%)" />
              <YAxis type="category" dataKey="label" width={160} stroke="hsl(230, 15%, 60%)" tick={{ fontSize: 12 }} />
              <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                {groupAverages.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-quiz-green">💪 Ең күшті: {strongest?.label}</span>
            <span className="text-destructive">📈 Дамыту керек: {weakest?.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostResults;
