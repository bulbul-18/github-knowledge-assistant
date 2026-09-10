"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getSession, getActiveChatId, getChat, addMessage, ChatMessage } from "@/lib/storage";

export default function ChatPage() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) {
      router.push("/login");
      return;
    }
    const id = getActiveChatId();
    if (!id) {
      router.push("/");
      return;
    }
    const chat = getChat(id);
    if (!chat) {
      router.push("/");
      return;
    }
    setChatId(chat.id);
    setRepoName(chat.repoName);
    setMessages(chat.messages);
    setChecked(true);
  }, [router]);

  async function handleAsk() {
    if (!chatId) return;
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

      const newMessage: ChatMessage = { question: currentQuestion, answer: data.answer, sources: data.sources };
      addMessage(chatId, newMessage);
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  return (
    <>
      <NavBar />
      <main className="min-h-screen flex flex-col max-w-2xl mx-auto px-6">
        <div className="pt-8 pb-6 border-b border-line">
          <p className="font-mono text-xs text-ink-muted mb-1">indexed repository</p>
          <h1 className="text-lg font-medium">{repoName}</h1>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-8">
          {messages.length === 0 && (
            <p className="text-ink-muted text-sm">Ask something about the indexed repository to get started.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i}>
              <div className="flex justify-end mb-3">
                <div className="bg-ink text-paper rounded-lg px-4 py-2 text-sm max-w-[80%]">{msg.question}</div>
              </div>
              <div className="bg-surface border border-line rounded-lg p-4">
                <p className="text-sm leading-relaxed mb-4">{msg.answer}</p>
                <div className="flex flex-col gap-2">
                  {msg.sources.map((s, j) => (
                    <div key={j} className="flex items-center gap-3 py-1.5 border-l-2 border-git-green pl-3">
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
    </>
  );
}