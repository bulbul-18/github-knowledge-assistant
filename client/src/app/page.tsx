"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleIndex() {
    setError("");
    if (!repoUrl.trim()) {
      setError("Enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong while indexing");

      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6">
      <div className="w-full max-w-2xl pt-24 pb-16">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-git-green" />
          <span className="font-mono text-xs text-ink-muted tracking-wide">
            semantic search · grounded answers
          </span>
        </div>

        <h1 className="text-4xl font-medium tracking-tight mb-4">
          Chat with any codebase
        </h1>
        <p className="text-ink-muted text-lg mb-10 max-w-md">
          Paste a repository. Ask questions in plain English. Every answer is
          traced back to the exact file and line it came from.
        </p>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            className="flex-1 font-mono text-sm bg-surface border border-line rounded-md px-4 py-3 outline-none focus:border-git-green transition-colors"
          />
          <button
            onClick={handleIndex}
            disabled={loading}
            className="bg-ink text-paper px-5 py-3 rounded-md text-sm font-medium hover:bg-git-green transition-colors disabled:opacity-50"
          >
            {loading ? "Indexing…" : "Index repository"}
          </button>
        </div>

        {error && (
          <p className="text-git-red text-sm mt-2">{error}</p>
        )}
        {loading && (
          <p className="text-ink-muted text-sm mt-2">
            Fetching files, chunking, and generating embeddings — this can take a minute or two.
          </p>
        )}
      </div>

      <div className="w-full max-w-2xl pb-24">
        <p className="font-mono text-xs text-ink-muted mb-3 tracking-wide">
          what a grounded answer looks like
        </p>
        <div className="bg-surface border border-line rounded-lg p-5">
          <p className="text-sm mb-4">
            The user submits credentials via a form, which are validated and
            authenticated on the server. A JWT token is issued as a cookie on success.
          </p>
          <div className="flex items-center gap-3 py-2 border-l-2 border-git-green pl-3">
            <span className="font-mono text-xs text-ink-muted flex-1">
              client/src/app/api/auth/login/route.ts
              <span className="text-ink-muted/60"> · lines 36–63</span>
            </span>
            <span className="font-mono text-xs bg-git-amber-light text-git-amber px-2 py-0.5 rounded">
              0.37
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}