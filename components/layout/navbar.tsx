"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Film, MessageCircle, Sparkles } from "lucide-react";

import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/collections", label: "Collections" },
  { href: "/ai", label: "AI" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Film className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline">Movie Vault</span>
          </Link>
          <Badge variant="muted" className="hidden sm:inline-flex">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> TMDB + LangChain
          </Badge>
        </div>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 transition-colors hover:text-primary",
                  active ? "bg-accent text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/ai">
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat
            </Button>
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {session.user.name ?? "you"}</span>
              <Button variant="secondary" size="sm" onClick={() => signOut({ redirect: false })}>
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
    </header>
  );
}
