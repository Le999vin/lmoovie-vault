"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Film, LogOut, MessageCircle, Sparkles } from "lucide-react";

import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/collections", label: "Collections" },
  { href: "/ai", label: "AI" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 mb-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass fade-border mt-3 flex h-16 items-center justify-between rounded-full px-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 text-base font-semibold">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/90 to-cyan-400/80 text-white shadow-lg">
                <Film className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">Movie Vault</span>
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              TMDB + LangChain
            </div>
          </div>

          <nav className="flex items-center gap-1 text-sm font-medium">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3 py-2 transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-blue-50"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/ai" aria-label="Open AI chat">
              <Button variant="ghost" size="sm" className="gap-2 rounded-full border border-transparent hover:border-blue-100">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">AI Chat</span>
              </Button>
            </Link>
            {session?.user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Hi, {session.user.name ?? "you"}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => signOut({ redirect: false })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : status === "loading" ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : (
              <LoginDialog />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
