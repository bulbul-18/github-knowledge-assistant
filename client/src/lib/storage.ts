export type Source = { filePath: string; startLine: number; endLine: number; score: number };
export type ChatMessage = { question: string; answer: string; sources: Source[] };
export type ChatSession = {
  id: string;
  repositoryId: string;
  repoUrl: string;
  repoName: string;
  createdAt: number;
  messages: ChatMessage[];
};

const CHATS_KEY = "gka_chats";
const ACTIVE_KEY = "gka_active_chat";
const SESSION_KEY = "gka_session";

// --- Cosmetic session (no real auth yet) ---
export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}
export function setSession(email: string) {
  localStorage.setItem(SESSION_KEY, email);
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Chats ---
export function getChats(): ChatSession[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHATS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveChats(chats: ChatSession[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}
export function createChat(repositoryId: string, repoUrl: string, repoName: string): ChatSession {
  const newChat: ChatSession = {
    id: crypto.randomUUID(),
    repositoryId,
    repoUrl,
    repoName,
    createdAt: Date.now(),
    messages: [],
  };
  saveChats([newChat, ...getChats()]);
  setActiveChatId(newChat.id);
  return newChat;
}
export function getChat(id: string): ChatSession | undefined {
  return getChats().find((c) => c.id === id);
}
export function addMessage(chatId: string, message: ChatMessage) {
  const updated = getChats().map((c) =>
    c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
  );
  saveChats(updated);
}
export function deleteChat(id: string) {
  saveChats(getChats().filter((c) => c.id !== id));
  if (getActiveChatId() === id) clearActiveChatId();
}
export function getActiveChatId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}
export function setActiveChatId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}
export function clearActiveChatId() {
  localStorage.removeItem(ACTIVE_KEY);
}