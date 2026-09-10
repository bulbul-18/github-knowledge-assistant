"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/storage";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSession(email);
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-surface border border-line rounded-lg p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-2 h-2 rounded-full bg-git-green" />
          <span className="font-medium text-sm">GitHub Knowledge Assistant</span>
        </div>

        <div className="flex border border-line rounded-md p-1 mb-6">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 text-sm py-1.5 rounded transition-colors ${mode === "signin" ? "bg-ink text-paper" : "text-ink-muted"}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 text-sm py-1.5 rounded transition-colors ${mode === "signup" ? "bg-ink text-paper" : "text-ink-muted"}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-git-green transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-git-green transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="bg-ink text-paper rounded-md py-2.5 text-sm font-medium hover:bg-git-green transition-colors mt-2"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-6">
          Placeholder login — no real account is created yet. Real authentication comes in a later phase.
        </p>
      </div>
    </main>
  );
}