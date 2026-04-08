import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Crown, Users, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { soundManager } from "@/lib/sounds";
import { INDICATOR_LABELS, ANSWER_COLORS, QUESTION_TIME_SECONDS, LEADERBOARD_DISPLAY_SECONDS } from "@/lib/game-types";
import type { Game, Player, Question, Answer } from "@/lib/game-types";
import HostResults from "@/components/game/HostResults";

const HostGame = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [answeredCount, setAnsweredCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions.find(
    (q) => q.order_num === game?.current_question
  );

  useEffect(() => {
    loadGame();
    loadQuestions();
    loadPlayers();
  }, [gameId]);

  // Real-time answers
  useEffect(() => {
    if (!gameId) return;
    const channel = supabase
      .channel(`host-answers-${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers" },
        (payload) => {
          const newAnswer = payload.new as Answer;
          setAnswers((prev) => [...prev, newAnswer]);
          setAnsweredCount((c) => c + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  // Timer
  useEffect(() => {
    if (!game || game.status !== "active" || showLeaderboard) return;
    setTimeLeft(QUESTION_TIME_SECONDS);
    setAnsweredCount(0);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        if (prev <= 5) soundManager.countdown();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game?.current_question, showLeaderboard]);

  const loadGame = async () => {
    const { data } = await supabase
      .from("games")
      .select()
      .eq("id", gameId!)
      .single();
    if (data) setGame(data);
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select()
      .order("order_num");
    if (data) setQuestions(data);
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select()
      .eq("game_id", gameId!);
    if (data) setPlayers(data);
  };

  const handleTimeUp = () => {
    setShowLeaderboard(true);
    refreshPlayers();
  };

  const refreshPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select()
      .eq("game_id", gameId!)
      .order("total_score", { ascending: false });
    if (data) setPlayers(data);
  };

  const nextQuestion = async () => {
    if (!game) return;
    const next = game.current_question + 1;
    if (next > questions.length) {
      // Game finished
      await supabase
        .from("games")
        .update({ status: "finished" })
        .eq("id", game.id);
      setGame({ ...game, status: "finished" });
      soundManager.fanfare();
      return;
    }
    await supabase
      .from("games")
      .update({ current_question: next })
      .eq("id", game.id);
    setGame({ ...game, current_question: next });
    setShowLeaderboard(false);
    setAnsweredCount(0);
  };

  if (!game || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (game.status === "finished") {
    return <HostResults gameId={game.id} players={players} questions={questions} answers={answers} />;
  }

  const options = currentQuestion ? (currentQuestion.options as string[]) : [];

  return (
    <div className="flex min-h-screen flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <span className="font-bold">Көшбасшы Quiz</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{answeredCount}/{players.length}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(soundManager.toggle())}>
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {showLeaderboard ? (
        /* Leaderboard */
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <h2 className="text-3xl font-bold text-primary">🏆 Көшбасшылар</h2>
          <div className="w-full max-w-lg space-y-3">
            {players.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl bg-card p-4"
              >
                <span className="text-2xl font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.school}</p>
                </div>
                <span className="text-lg font-bold text-primary">
                  {p.total_score}
                </span>
              </div>
            ))}
          </div>
          <Button size="lg" className="mt-4 h-14 px-12 text-lg font-bold" onClick={nextQuestion}>
            {game.current_question >= questions.length ? "Нәтижелер" : "Келесі сұрақ →"}
          </Button>
        </div>
      ) : (
        /* Question display */
        <div className="flex flex-1 flex-col">
          {/* Progress + Timer */}
          <div className="mb-6 flex items-center justify-between">
            <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
              {game.current_question}/{questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {currentQuestion && INDICATOR_LABELS[currentQuestion.indicator as keyof typeof INDICATOR_LABELS]}
            </span>
            <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
              timeLeft <= 5 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
            }`}>
              {timeLeft}
            </div>
          </div>

          {/* Question text */}
          <div className="mb-8 rounded-2xl bg-card p-6 md:p-8">
            <h2 className="text-center text-xl font-bold md:text-3xl">
              {currentQuestion?.text_kk}
            </h2>
          </div>

          {/* Answer options */}
          <div className="grid flex-1 grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <div
                key={i}
                className={`flex items-center justify-center rounded-xl ${ANSWER_COLORS[i].bg} p-4 md:p-6`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white/80">
                    {ANSWER_COLORS[i].label}
                  </span>
                  <span className="text-center text-lg font-semibold text-white md:text-xl">
                    {opt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostGame;
