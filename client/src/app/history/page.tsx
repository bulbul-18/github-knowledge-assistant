"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getSession, getChats, setActiveChatId, deleteChat, ChatSession } from "@/lib/storage";

export default function HistoryPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) {
      router.push("/login");
      return;
    }
    setChats(getChats());
    setChecked(true);
  }, [router]);

  function openChat(id: string) {
    setActiveChatId(id);
    router.push("/chat");
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteChat(id);
    setChats(getChats());
  }

  if (!checked) return null;

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-lg font-medium mb-6">Chat history</h1>

        {chats.length === 0 && (
          <p className="text-ink-muted text-sm">No chats yet. Index a repository to start one.</p>
        )}

        <div className="flex flex-col gap-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="flex items-center justify-between border border-line rounded-md px-4 py-3 cursor-pointer hover:border-git-green transition-colors bg-surface"
            >
              <div>
                <p className="font-mono text-sm">{chat.repoName}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(chat.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(chat.id, e)}
                className="text-xs text-ink-muted hover:text-git-red transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}