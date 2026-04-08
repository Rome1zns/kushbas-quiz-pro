import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { soundManager } from "@/lib/sounds";
import { calculateScore } from "@/lib/game-utils";
import { ANSWER_COLORS, TOTAL_QUIZ_SECONDS, INDICATOR_LABELS } from "@/lib/game-types";
import type { Game, Question } from "@/lib/game-types";
import PlayerResults from "@/components/game/PlayerResults";

const PlayerGame = () => {
  const { gameId, playerId } = useParams<{ gameId: string; playerId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_QUIZ_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const quizStartedRef = useRef(false);

  const currentQuestion = questions.find(
    (q) => q.order_num === game?.current_question
  );

  // Load initial data
  useEffect(() => {
    loadGame();
    loadQuestions();
  }, [gameId]);

  // Subscribe to game changes
  useEffect(() => {
    if (!gameId) return;
    const channel = supabase
      .channel(`player-game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          const updated = payload.new as Game;
          setGame(updated);
          if (updated.current_question !== game?.current_question) {
            // New question
            setAnswered(false);
            setSelectedAnswer(null);
            setIsCorrect(null);
            questionStartRef.current = Date.now();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameId, game?.current_question]);

  // Global 30-second timer synced with host
  useEffect(() => {
    if (!game || game.status !== "active" || answered) return;

    if (!quizStartedRef.current) {
      quizStartedRef.current = true;
      soundManager.startBackgroundMusic();
    }

    setTimeLeft(TOTAL_QUIZ_SECONDS);
    const questionWindowMs = (TOTAL_QUIZ_SECONDS / questions.length) * 1000;
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          quizStartedRef.current = false;
          soundManager.stopBackgroundMusic();
          return 0;
        }
        if (prev <= 5) soundManager.countdown();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game?.status, questions.length]);

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

  const submitAnswer = async (optionIndex: number) => {
    if (answered || !currentQuestion || !playerId) return;
    setAnswered(true);
    setSelectedAnswer(optionIndex);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Date.now() - questionStartRef.current;
    const questionWindowMs = (TOTAL_QUIZ_SECONDS / questions.length) * 1000;
    const timeRemaining = questionWindowMs - timeTaken;
    const score = calculateScore(timeRemaining, questionWindowMs);

    // All answers get a neutral "received" sound
    soundManager.tick();

    // Save answer
    await supabase.from("answers").insert({
      player_id: playerId,
      question_id: currentQuestion.id,
      selected_option: optionIndex,
      time_taken_ms: timeTaken,
      score_earned: score,
    });

    // Update player total score (always, regardless of answer choice)
    const { data: player } = await supabase
      .from("players")
      .select("total_score")
      .eq("id", playerId)
      .single();
    if (player) {
      await supabase
        .from("players")
        .update({ total_score: player.total_score + score })
        .eq("id", playerId);
    }
  };

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Waiting for start
  if (game.status === "lobby") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Crown className="mb-4 h-16 w-16 text-primary animate-float" />
        <h2 className="text-2xl font-bold">Ойын басталуын күтіңіз...</h2>
        <p className="mt-2 text-muted-foreground">Хост ойынды бастағанда сіз автоматты түрде кіресіз</p>
      </div>
    );
  }

  // Finished
  if (game.status === "finished") {
    return <PlayerResults gameId={gameId!} playerId={playerId!} questions={questions} />;
  }

  const options = currentQuestion ? (currentQuestion.options as string[]) : [];

  return (
    <div className="flex min-h-screen flex-col p-4">
      {/* Timer + progress */}
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
          {game.current_question}/{questions.length}
        </span>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
          timeLeft <= 5 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
        }`}>
          {timeLeft}
        </div>
      </div>

      {answered ? (
        /* Answered state */
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <CheckCircle className="h-20 w-20 text-primary" />
          <h2 className="text-2xl font-bold">
            Жауабыңыз қабылданды ✓
          </h2>
          <p className="text-muted-foreground">Келесі сұрақты күтіңіз...</p>
        </div>
      ) : (
        /* Answer buttons */
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => submitAnswer(i)}
              className={`flex items-center gap-3 rounded-xl ${ANSWER_COLORS[i].bg} ${ANSWER_COLORS[i].hover} p-6 text-left transition-transform active:scale-95`}
            >
              <span className="text-3xl font-bold text-white/70">
                {ANSWER_COLORS[i].label}
              </span>
              <span className="flex-1 text-lg font-semibold text-white">
                {opt}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
