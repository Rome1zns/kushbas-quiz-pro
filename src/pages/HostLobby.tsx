import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Copy, Users, Play, Volume2, VolumeX } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generatePin } from "@/lib/game-utils";
import { soundManager } from "@/lib/sounds";
import type { Game, Player } from "@/lib/game-types";
import { toast } from "sonner";

const HostLobby = () => {
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    createGame();
  }, []);

  useEffect(() => {
    if (!game) return;
    const channel = supabase
      .channel(`lobby-${game.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `game_id=eq.${game.id}` },
        (payload) => {
          setPlayers((prev) => [...prev, payload.new as Player]);
          soundManager.correct();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [game]);

  const createGame = async () => {
    const pin = generatePin();
    const { data, error } = await supabase
      .from("games")
      .insert({ pin })
      .select()
      .single();
    if (error) {
      toast.error("Ойын құру кезінде қате пайда болды");
      return;
    }
    setGame(data);
    setLoading(false);
  };

  const startGame = async () => {
    if (!game || players.length === 0) {
      toast.error("Кем дегенде 1 ойыншы қосылуы керек");
      return;
    }
    await supabase
      .from("games")
      .update({ status: "active", current_question: 1 })
      .eq("id", game.id);
    navigate(`/host/game/${game.id}`);
  };

  const copyPin = () => {
    if (game) {
      navigator.clipboard.writeText(game.pin);
      toast.success("PIN көшірілді!");
    }
  };

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?pin=${game?.pin}` : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Көшбасшы Quiz</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(soundManager.toggle())}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>

        {/* PIN display */}
        <div className="mb-8 rounded-2xl bg-card p-8 text-center">
          <p className="mb-2 text-muted-foreground">Ойынға қосылу PIN коды:</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-6xl font-extrabold tracking-[0.3em] text-primary">
              {game?.pin}
            </span>
            <Button variant="ghost" size="icon" onClick={copyPin}>
              <Copy className="h-6 w-6" />
            </Button>
          </div>

          {/* QR */}
          <div className="mt-6 flex justify-center">
            <div className="rounded-xl bg-foreground p-3">
              <QRCodeSVG value={joinUrl} size={160} />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            QR кодты сканерлеңіз немесе PIN кодты теріңіз
          </p>
        </div>

        {/* Players list */}
        <div className="mb-6 rounded-2xl bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Қосылған ойыншылар ({players.length})
            </h2>
          </div>
          {players.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ойыншылар қосылуын күтіңіз...
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-secondary p-3 text-center"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.school}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <Button
          size="lg"
          className="h-16 w-full text-xl font-bold"
          onClick={startGame}
          disabled={players.length === 0}
        >
          <Play className="mr-2 h-6 w-6" />
          Бастау ({players.length} ойыншы)
        </Button>
      </div>
    </div>
  );
};

export default HostLobby;
