import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PlayerJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"pin" | "name">("pin");
  const [pin, setPin] = useState(searchParams.get("pin") || "");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      toast.error("PIN код 6 саннан тұруы тиіс");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select()
      .eq("pin", pin)
      .single();
    setLoading(false);

    if (error || !data) {
      toast.error("Бұл PIN кодпен ойын табылмады");
      return;
    }
    if (data.status !== "lobby") {
      toast.error("Бұл ойын қазірдің өзінде басталған");
      return;
    }
    setGameId(data.id);
    setStep("name");
  };

  const handleJoin = async () => {
    if (!name.trim() || !school.trim()) {
      toast.error("Атыңыз бен мектебіңізді толтырыңыз");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("players")
      .insert({ game_id: gameId, name: name.trim(), school: school.trim() })
      .select()
      .single();
    setLoading(false);

    if (error) {
      toast.error("Қосылу кезінде қате пайда болды");
      return;
    }
    navigate(`/play/${gameId}/${data.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Crown className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Көшбасшы Quiz</h1>
        </div>

        {step === "pin" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Ойын PIN коды
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="h-16 text-center text-3xl font-bold tracking-[0.3em]"
                autoFocus
              />
            </div>
            <Button
              size="lg"
              className="h-14 w-full text-lg font-bold"
              onClick={handlePinSubmit}
              disabled={pin.length !== 6 || loading}
            >
              Кіру <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Аты-жөніңіз
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Есіміңізді жазыңыз"
                className="h-14 text-lg"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                Мектеп / Аймақ
              </label>
              <Input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Мектебіңізді жазыңыз"
                className="h-14 text-lg"
              />
            </div>
            <Button
              size="lg"
              className="h-14 w-full text-lg font-bold"
              onClick={handleJoin}
              disabled={!name.trim() || !school.trim() || loading}
            >
              Қосылу <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerJoin;
