"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, clearSession } from "@/lib/storage";

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setEmail(getSession());
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const tabs = [
    { href: "/", label: "New chat" },
    { href: "/history", label: "History" },
  ];

  return (
    <nav className="border-b border-line bg-surface">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-medium text-sm">GitHub Knowledge Assistant</span>
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  pathname === tab.href ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="font-mono text-xs text-ink-muted">{email}</span>}
          <button
            onClick={handleLogout}
            className="text-xs border border-line rounded-md px-3 py-1.5 hover:border-git-red hover:text-git-red transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}