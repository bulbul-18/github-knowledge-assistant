"use client";

import { useState } from "react";

type Source = {
  filePath: string;
  startLine: number;
  endLine: number;
  score: number;
};

type Message = {
  question: string;
  answer: string;
  sources: Source[];
};

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk() {
    setError("");
    if (!question.trim()) return;

    setLoading(true);
    const currentQuestion = question;
    setQuestion("");

    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessages((prev) => [
        ...prev,
        { question: currentQuestion, answer: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto px-6">
      <div className="pt-8 pb-6 border-b border-line">
        <h1 className="text-lg font-medium">Chat with the repository</h1>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-8">
        {messages.length === 0 && (
          <p className="text-ink-muted text-sm">
            Ask something about the indexed repository to get started.
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className="flex justify-end mb-3">
              <div className="bg-ink text-paper rounded-lg px-4 py-2 text-sm max-w-[80%]">
                {msg.question}
              </div>
            </div>

            <div className="bg-surface border border-line rounded-lg p-4">
              <p className="text-sm leading-relaxed mb-4">{msg.answer}</p>
              <div className="flex flex-col gap-2">
                {msg.sources.map((s, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 py-1.5 border-l-2 border-git-green pl-3"
                  >
                    <span className="font-mono text-xs text-ink-muted flex-1 truncate">
                      {s.filePath}
                      <span className="text-ink-muted/60"> · lines {s.startLine}–{s.endLine}</span>
                    </span>
                    <span className="font-mono text-xs bg-git-amber-light text-git-amber px-2 py-0.5 rounded shrink-0">
                      {s.score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-paper pt-2 pb-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about the repo"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            disabled={loading}
            className="flex-1 bg-surface border border-line rounded-md px-4 py-2.5 text-sm outline-none focus:border-git-green transition-colors"
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-ink text-paper px-5 py-2.5 rounded-md text-sm font-medium hover:bg-git-green transition-colors disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
        {error && <p className="text-git-red text-sm mt-2">{error}</p>}
      </div>
    </main>
  );
}