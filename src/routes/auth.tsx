import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · World Quest" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl border-2 border-primary/10">
        <div className="text-center text-5xl">🌍</div>
        <h1 className="mt-2 text-center text-3xl font-black">
          {mode === "signup" ? "Join the journey" : "Welcome back"}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Create your traveler profile" : "Sign in to continue your quest"}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Input placeholder="Traveler name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
          )}
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
          <Input type="password" required minLength={6} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
          {err && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{err}</div>}
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-lg font-bold">
            {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <button
          onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(null); }}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Already a traveler? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}