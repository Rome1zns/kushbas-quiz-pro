import { useState, useEffect } from "react";
import { Crown, Plus, Trash2, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { INDICATOR_LABELS } from "@/lib/game-types";
import type { Question, QuizIndicator } from "@/lib/game-types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({
    text_kk: "",
    indicator: "strategic_thinking" as QuizIndicator,
    options: ["", "", "", ""],
    correct_answer: 0,
    order_num: 0,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select()
      .order("order_num");
    if (data) setQuestions(data);
  };

  const addQuestion = async () => {
    if (!newQ.text_kk || newQ.options.some((o) => !o.trim())) {
      toast.error("Барлық өрістерді толтырыңыз");
      return;
    }
    const { error } = await supabase.from("questions").insert({
      text_kk: newQ.text_kk,
      indicator: newQ.indicator,
      options: newQ.options,
      correct_answer: newQ.correct_answer,
      order_num: newQ.order_num || questions.length + 1,
    });
    if (error) {
      toast.error("Қате пайда болды");
      return;
    }
    toast.success("Сұрақ қосылды!");
    setShowAdd(false);
    setNewQ({ text_kk: "", indicator: "strategic_thinking", options: ["", "", "", ""], correct_answer: 0, order_num: 0 });
    loadQuestions();
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    toast.success("Сұрақ жойылды");
    loadQuestions();
  };

  const indicatorEntries = Object.entries(INDICATOR_LABELS) as [QuizIndicator, string][];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Сұрақтарды басқару</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>Басты бет</Button>
            <Button onClick={() => setShowAdd(!showAdd)}>
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-6 rounded-xl bg-card p-6 space-y-4">
            <h3 className="font-semibold">Жаңа сұрақ қосу</h3>
            <Textarea
              value={newQ.text_kk}
              onChange={(e) => setNewQ({ ...newQ, text_kk: e.target.value })}
              placeholder="Сұрақ мәтіні (қазақша)"
              rows={3}
            />
            <Select
              value={newQ.indicator}
              onValueChange={(v) => setNewQ({ ...newQ, indicator: v as QuizIndicator })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {indicatorEntries.map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newQ.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-sm font-bold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newQ.options];
                    opts[i] = e.target.value;
                    setNewQ({ ...newQ, options: opts });
                  }}
                  placeholder={`${i + 1}-нұсқа`}
                />
                <input
                  type="radio"
                  name="correct"
                  checked={newQ.correct_answer === i}
                  onChange={() => setNewQ({ ...newQ, correct_answer: i })}
                  className="h-4 w-4 accent-primary"
                />
              </div>
            ))}
            <Input
              type="number"
              value={newQ.order_num || ""}
              onChange={(e) => setNewQ({ ...newQ, order_num: parseInt(e.target.value) || 0 })}
              placeholder="Реттік нөмірі"
            />
            <Button onClick={addQuestion}>Сақтау</Button>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      #{q.order_num}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {INDICATOR_LABELS[q.indicator as QuizIndicator]}
                    </span>
                  </div>
                  <p className="font-medium">{q.text_kk}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {(q.options as string[]).map((opt, i) => (
                      <span
                        key={i}
                        className={`rounded px-2 py-1 text-xs ${
                          i === q.correct_answer
                            ? "bg-quiz-green/20 text-quiz-green font-medium"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}: {opt}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
