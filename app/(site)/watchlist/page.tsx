import Link from "next/link";
import { BookmarkPlus, LogIn } from "lucide-react";

import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { WatchlistBoard } from "@/components/watchlist/watchlist-board";
import { getAuthSession } from "@/lib/auth";
import { getWatchlistWithMeta } from "@/lib/db/queries";

export default async function WatchlistPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return (
      <EmptyState
        icon={LogIn}
        title="Watchlist"
        description="Sign in to start a personal watchlist, rate titles, and keep notes."
        action={{ label: "Sign in", href: "/ai" }}
        className="bg-white/80"
      />
    );
  }

  const entries = await getWatchlistWithMeta(session.user.id);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Watchlist"
        description="Track your planned, watching, completed, and dropped titles."
        action={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/discover">
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Add movies
            </Link>
          </Button>
        }
        eyebrow="Library"
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={BookmarkPlus}
          title="Nothing saved yet"
          description="Search TMDB and add a movie to your watchlist to see it here."
          action={{ label: "Discover", href: "/discover" }}
        />
      ) : (
        <WatchlistBoard entries={entries} />
      )}
    </div>
  );
}
