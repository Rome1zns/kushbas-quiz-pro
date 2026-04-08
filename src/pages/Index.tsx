import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="animate-float flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/20 ring-2 ring-primary/40">
            <Crown className="h-14 w-14 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="text-primary">Көшбасшы</span>{" "}
            <span className="text-foreground">Quiz</span>
          </h1>
          <p className="max-w-md text-center text-muted-foreground">
            Директорларға арналған интерактивті басқару құзыреттері сайысы
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Button
            size="lg"
            className="h-16 text-lg font-bold animate-pulse-glow"
            onClick={() => navigate("/host")}
          >
            <Crown className="mr-2 h-6 w-6" />
            Жаңа ойын құру
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="h-16 text-lg font-bold"
            onClick={() => navigate("/join")}
          >
            <Users className="mr-2 h-6 w-6" />
            Ойынға қосылу
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 text-base"
            onClick={() => navigate("/admin")}
          >
            <Settings className="mr-2 h-5 w-5" />
            Сұрақтарды басқару
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
