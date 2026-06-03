import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import heroImg from "@/assets/hero-world.jpg";
import { LEVELS, checkAnswer, rankFor } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "🌍 World Quest: Geography Adventure" },
      { name: "description", content: "Travel the world and learn geography by identifying famous landmarks." },
      { property: "og:title", content: "🌍 World Quest" },
      { property: "og:description", content: "An educational travel adventure game." },
    ],
  }),
  component: Index,
});

type Screen = "home" | "level" | "summary" | "end";
const FLAGS = ["🇫🇷", "🇺🇸", "🇯🇵", "🇨🇳", "🇬🇧", "🇮🇹", "🇧🇷", "🇦🇪"];

function maskOne(a: string) {
  const words = a.split(" ").filter(Boolean);
  const masked = words
    .map((w) => w[0].toUpperCase() + "•".repeat(Math.max(0, w.length - 1)))
    .join(" ");
  const letters = words.reduce((n, w) => n + w.length, 0);
  return { masked, letters, words: words.length };
}
function hintFor(answers: string[]) {
  const ru = answers.find((x) => /[а-яё]/i.test(x)) ?? "";
  const en = answers.find((x) => /[a-z]/i.test(x) && !/[а-яё]/i.test(x)) ?? answers[0] ?? "";
  return { ru: maskOne(ru), en: maskOne(en) };
}

function Index() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<{ total_correct: number; total_wrong: number; best_score: number; last_login_at: string | null; created_at: string | null }>({ total_correct: 0, total_wrong: 0, best_score: 0, last_login_at: null, created_at: null });

  const [screen, setScreen] = useState<Screen>("home");
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [money, setMoney] = useState(0);
  const [feedback, setFeedback] = useState<null | { kind: "correct" | "close" | "wrong"; msg: string; explain: string; gain: number }>(null);
  const [levelCorrect, setLevelCorrect] = useState(0);
  const [flying, setFlying] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Load profile + progress when signed in
  useEffect(() => {
    if (!user) { setDisplayName(""); setCompletedLevels(new Set()); return; }
    (async () => {
      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("display_name, current_level_idx, current_question_idx, total_score, total_money, level_correct, total_correct, total_wrong, best_score, last_login_at, created_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_progress").select("level_id, score, money").eq("user_id", user.id),
      ]);
      setDisplayName(profile?.display_name ?? user.email?.split("@")[0] ?? "Traveler");
      if (profile) {
        setLevelIdx(profile.current_level_idx ?? 0);
        setQIdx(profile.current_question_idx ?? 0);
        setLevelCorrect(profile.level_correct ?? 0);
        setScore(profile.total_score ?? 0);
        setMoney(profile.total_money ?? 0);
        setStats({
          total_correct: profile.total_correct ?? 0,
          total_wrong: profile.total_wrong ?? 0,
          best_score: profile.best_score ?? 0,
          last_login_at: profile.last_login_at ?? null,
          created_at: profile.created_at ?? null,
        });
      }
      if (progress) {
        setCompletedLevels(new Set(progress.map((p) => p.level_id)));
      }
      // Update last login timestamp
      await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("user_id", user.id);
    })();
  }, [user]);

  const level = LEVELS[levelIdx];
  const question = level?.questions[qIdx];

  const start = () => {
    // If all levels already completed, restart the journey from scratch
    if (completedLevels.size >= LEVELS.length) {
      setLevelIdx(0);
      setQIdx(0);
      setLevelCorrect(0);
      void savePlayerState({
        current_level_idx: 0,
        current_question_idx: 0,
        level_correct: 0,
      });
    }
    setScreen("level");
    setInput(""); setFeedback(null);
  };

  const resetProgress = async () => {
    if (!user) return;
    if (!confirm("Сбросить весь прогресс и начать заново?")) return;
    await supabase.from("user_progress").delete().eq("user_id", user.id);
    await supabase.from("profiles").update({
      current_level_idx: 0,
      current_question_idx: 0,
      level_correct: 0,
      total_score: 0,
      total_money: 0,
    }).eq("user_id", user.id);
    setCompletedLevels(new Set());
    setLevelIdx(0); setQIdx(0); setLevelCorrect(0);
    setScore(0); setMoney(0);
    setInput(""); setFeedback(null);
    setScreen("home");
  };

  type PlayerStatePatch = Partial<{
    current_level_idx: number;
    current_question_idx: number;
    total_score: number;
    total_money: number;
    level_correct: number;
    total_correct: number;
    total_wrong: number;
    best_score: number;
  }>;
  const savePlayerState = async (patch: PlayerStatePatch) => {
    if (!user) return;
    await supabase.from("profiles").update(patch).eq("user_id", user.id);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;
    const res = checkAnswer(input, question.answers);
    let gain = 0;
    let msg = "";
    let newLevelCorrect = levelCorrect;
    let newTotalCorrect = stats.total_correct;
    let newTotalWrong = stats.total_wrong;
    if (res === "correct") { gain = 10; msg = "Correct! ✅"; newLevelCorrect = levelCorrect + 1; setLevelCorrect(newLevelCorrect); newTotalCorrect += 1; }
    else if (res === "close") { gain = 5; msg = "So close! 🤏"; newTotalCorrect += 1; }
    else { gain = 0; msg = "Not quite. ❌"; newTotalWrong += 1; }
    const newScore = score + gain;
    const newMoney = money + Math.floor(gain / 2);
    const newBest = Math.max(stats.best_score, newScore);
    setScore(newScore);
    setMoney(newMoney);
    setStats((s) => ({ ...s, total_correct: newTotalCorrect, total_wrong: newTotalWrong, best_score: newBest }));
    setFeedback({ kind: res, msg, explain: question.explain, gain });
    void savePlayerState({
      total_score: newScore,
      total_money: newMoney,
      level_correct: newLevelCorrect,
      total_correct: newTotalCorrect,
      total_wrong: newTotalWrong,
      best_score: newBest,
    });
  };

  const next = () => {
    setInput(""); setFeedback(null); setShowHint(false);
    if (qIdx < 2) {
      const nq = qIdx + 1;
      setFlying(true);
      window.setTimeout(() => {
        setQIdx(nq);
        setFlying(false);
        void savePlayerState({ current_question_idx: nq });
      }, 1400);
      return;
    }
    // Save level progress to backend
    void saveLevelProgress();
    setScreen("summary");
  };

  const saveLevelProgress = async () => {
    if (!user) return;
    const allRight = levelCorrect === 3;
    const levelScore = levelCorrect * 10 + (allRight ? 20 : 0);
    const levelMoney = levelCorrect * 5 + (allRight ? 10 : 0);
    await supabase.from("user_progress").upsert({
      user_id: user.id,
      level_id: level.id,
      correct_count: levelCorrect,
      score: levelScore,
      money: levelMoney,
    }, { onConflict: "user_id,level_id" });
    setCompletedLevels((s) => new Set(s).add(level.id));
  };

  const goNextLevel = () => {
    let newScore = score;
    let newMoney = money;
    if (levelCorrect === 3) {
      newScore = score + 20;
      newMoney = money + 10;
      setScore(newScore);
      setMoney(newMoney);
    }
    if (levelIdx + 1 >= LEVELS.length) {
      void savePlayerState({ total_score: newScore, total_money: newMoney });
      setScreen("end");
      return;
    }
    const nl = levelIdx + 1;
    setFlying(true);
    setScreen("level");
    window.setTimeout(() => {
      setLevelIdx(nl); setQIdx(0); setLevelCorrect(0); setShowHint(false);
      setFlying(false);
    }, 1400);
    void savePlayerState({
      current_level_idx: nl,
      current_question_idx: 0,
      level_correct: 0,
      total_score: newScore,
      total_money: newMoney,
    });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">🌍 Loading...</div>;

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <img src={heroImg} alt="World landmarks collage" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-6xl font-black tracking-tight drop-shadow-md md:text-8xl">🌍 WORLD QUEST</h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/80">Sign in to start your geography adventure.</p>
          <Link to="/auth">
            <Button className="mt-10 h-16 rounded-full px-12 text-2xl font-bold shadow-2xl hover:scale-105 transition">
              ▶️ Sign in / Register
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <img src={heroImg} alt="World landmarks collage" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3 rounded-full bg-card/90 px-4 py-2 shadow">
          <span className="text-sm font-bold">👋 {displayName}</span>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex flex-wrap justify-center gap-2 text-3xl">
            {FLAGS.map((f) => <span key={f} className="drop-shadow-lg">{f}</span>)}
          </div>
          <h1 className="text-6xl font-black tracking-tight text-foreground drop-shadow-md md:text-8xl">
            🌍 WORLD QUEST
          </h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/80 md:text-xl">
            A geography adventure across the world's greatest landmarks.
          </p>
          {completedLevels.size > 0 && (
            <div className="mt-4 rounded-full bg-card/80 px-5 py-2 text-sm font-bold">
              Progress: {completedLevels.size}/{LEVELS.length} stops · ⭐ {score} · 💸 {money}
            </div>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold">🏆 Best: {stats.best_score}</span>
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold">✅ Правильных ответов: {stats.total_correct}</span>
            <span className="rounded-full bg-card/80 px-3 py-1 font-semibold">❌ Неправильных ответов: {stats.total_wrong}</span>
          </div>
          <Button
            onClick={start}
            className="mt-10 h-16 rounded-full bg-primary px-12 text-2xl font-bold text-primary-foreground shadow-2xl transition hover:scale-105"
          >
            {completedLevels.size > 0 && completedLevels.size < LEVELS.length ? "▶️ CONTINUE" : "▶️ PLAY"}
          </Button>
          {completedLevels.size > 0 && (
            <button
              onClick={resetProgress}
              className="mt-4 text-sm text-foreground/70 underline hover:text-foreground"
            >
              🔄 Начать заново
            </button>
          )}
          <p className="mt-6 text-sm text-foreground/70">7 stops · 21 questions · 1 world</p>
        </div>
      </div>
    );
  }

  if (screen === "end") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-secondary/30 px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border-2 border-primary/20 bg-card p-10 text-center shadow-2xl">
          <div className="text-6xl">🏁</div>
          <h2 className="mt-4 text-4xl font-black">Journey Complete!</h2>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-accent/30 p-6">
              <div className="text-sm uppercase tracking-wide">Score</div>
              <div className="text-4xl font-black">{score} ⭐</div>
            </div>
            <div className="rounded-2xl bg-secondary/30 p-6">
              <div className="text-sm uppercase tracking-wide">Money</div>
              <div className="text-4xl font-black">{money} 💸</div>
            </div>
          </div>
          <div className="mt-8 text-2xl font-bold">{rankFor(score)}</div>
          <Button onClick={() => setScreen("home")} className="mt-8 h-12 rounded-full px-8 text-lg">
            Travel again
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    const allRight = levelCorrect === 3;
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-card p-8 shadow-xl">
          <div className="text-center text-5xl">{level.flag}</div>
          <h2 className="mt-2 text-center text-3xl font-black">{level.monument}</h2>
          <p className="text-center text-muted-foreground">{level.city}, {level.country}</p>
          <div className="mt-6 rounded-2xl bg-accent/20 p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-foreground/70">🎓 Fun Fact</div>
            <p className="mt-1">{level.fact}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-secondary/20 p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-foreground/70">📚 Vocabulary</div>
            <p className="mt-1 font-medium">{level.vocab.join(" · ")}</p>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg">You got <b>{levelCorrect}/3</b> correct.</div>
            {allRight && <div className="mt-1 font-bold text-primary">🎉 Level bonus: +20 points · +10 💸</div>}
          </div>
          <Button onClick={goNextLevel} className="mt-6 h-12 w-full rounded-full text-lg">
            {levelIdx + 1 >= LEVELS.length ? "Finish journey 🏁" : "Travel to next stop ✈️"}
          </Button>
        </div>
      </div>
    );
  }

  // level screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-accent/20">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* HUD */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-full bg-card px-4 py-2 shadow text-sm">
          <div className="font-bold">Level {level.id} / {LEVELS.length}</div>
          <div className="flex items-center gap-3">
            <span>⭐ {score}</span>
            <span>💸 {money}</span>
            <span>{level.flag} {level.country}</span>
          </div>
        </div>

        {/* Always-visible level progress dots */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-card/70 px-3 py-2 shadow-sm">
          {LEVELS.map((l, i) => {
            const done = completedLevels.has(l.id);
            const current = i === levelIdx;
            return (
              <div
                key={l.id}
                title={`${l.country} — ${l.monument}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-base transition ${
                  current ? "border-primary bg-primary/15 scale-110" :
                  done ? "border-accent bg-accent/20" : "border-muted bg-card opacity-60"
                }`}
              >
                {done ? "✅" : l.flag}
              </div>
            );
          })}
        </div>

        {flying && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-sky-200/90 to-sky-50/70">
            <div className="absolute top-1/2 left-0 text-[12rem] md:text-[16rem] animate-plane-fly drop-shadow-2xl">✈️</div>
            <div className="absolute top-[20%] left-[15%] text-8xl opacity-70 animate-cloud-drift">☁️</div>
            <div className="absolute top-[55%] left-[45%] text-7xl opacity-70 animate-cloud-drift">☁️</div>
            <div className="absolute top-[40%] left-[70%] text-8xl opacity-60 animate-cloud-drift">☁️</div>
            <div className="absolute bottom-12 left-0 right-0 text-center text-3xl md:text-4xl font-bold text-foreground/80">Летим к следующему вопросу...</div>
          </div>
        )}

        {/* Two-column: image + question side-by-side on desktop */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <img src={level.image} alt={level.monument} className="h-48 w-full object-cover md:h-[420px]" />
          </div>

          <div className="rounded-2xl bg-card p-4 shadow-xl">
            <div className="rounded-xl border-l-4 border-primary bg-accent/10 p-2">
              <div className="text-xs font-bold text-primary">{level.npc}</div>
              <p className="text-xs">{level.intro}</p>
            </div>

            <div className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Question {qIdx + 1} of 3
            </div>
            <h3 className="mt-1 text-xl font-black md:text-2xl">{question.q}</h3>

            <form onSubmit={submit} className="mt-3 flex gap-2">
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="✍️ Ответ (на русском или English)..."
              disabled={!!feedback}
              className="h-12 text-base border-2 border-primary/40 focus-visible:border-primary"
            />
            <Button type="submit" disabled={!!feedback || !input.trim()} className="h-12 px-5">
              Submit
            </Button>
            </form>

            {/* Hint */}
            <div className="mt-2">
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs font-semibold text-primary underline hover:opacity-80"
              >
                💡 Показать подсказку
              </button>
            ) : (() => {
              const h = hintFor(question.answers);
              return (
                <div className="rounded-xl border border-dashed border-primary/40 bg-accent/10 p-3 text-xs space-y-1.5">
                  <div className="font-bold text-primary text-sm">💡 Подсказка</div>
                  <div>🔤 Букв в ответе: <b>{h.letters}</b> ({h.words === 1 ? "1 слово" : `${h.words} слова`})</div>
                  <div>✏️ Первая буква: <span className="font-mono text-base tracking-widest text-primary font-bold">{h.masked}</span></div>
                  <div className="text-muted-foreground">Можно писать на русском или английском.</div>
                </div>
              );
            })()}
            </div>

            {feedback && (
            <div className={`mt-3 rounded-xl p-3 ${
              feedback.kind === "correct" ? "bg-primary/15"
              : feedback.kind === "close" ? "bg-accent/30" : "bg-destructive/15"
            }`}>
              <div className="text-base font-bold">{feedback.msg}</div>
              <div className="text-xs">{feedback.explain}</div>
              {feedback.gain > 0 && (
                <div className="mt-1 text-xs font-bold">
                  Вы получили +{feedback.gain} очков ⭐ · +{Math.floor(feedback.gain / 2)} 💸
                </div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                Всего правильных: <b>{stats.total_correct}</b> · Неправильных: <b>{stats.total_wrong}</b>
              </div>
              <Button onClick={next} className="mt-2 rounded-full" size="sm">
                {qIdx < 2 ? "✈️ Следующий вопрос →" : "Посмотреть результаты →"}
              </Button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
