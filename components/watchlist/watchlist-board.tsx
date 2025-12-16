"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, Sparkles } from "lucide-react";

import { MovieCard } from "@/components/movie/movie-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MovieGrid } from "@/components/ui/movie-grid";
import { WatchlistStatusPicker } from "@/components/watchlist/status-picker";
import type { WatchStatus } from "@/lib/db/queries";
import type { getWatchlistWithMeta } from "@/lib/db/queries";

type WatchlistItem = Awaited<ReturnType<typeof getWatchlistWithMeta>>[number];

const statuses: { value: WatchStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
  { value: "dropped", label: "Abandoned" },
];

export function WatchlistBoard({ entries }: { entries: WatchlistItem[] }) {
  const [active, setActive] = useState<WatchStatus>("planned");
  const [items, setItems] = useState(entries);

  const filtered = useMemo(
    () => items.filter((item) => item.entry.status === active),
    [items, active],
  );

  const updateStatus = (tmdbId: number, status: WatchStatus) => {
    setItems((prev) =>
      prev.map((item) =>
        item.movie.tmdbId === tmdbId ? { ...item, entry: { ...item.entry, status } } : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Button
              key={status.value}
              size="sm"
              variant={status.value === active ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setActive(status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-blue-500" />
          {filtered.length} movies in {statuses.find((s) => s.value === active)?.label}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookmarkPlus}
          title="Nothing here yet"
          description="Add movies from Discover or detail pages to build this list."
          action={{ label: "Discover movies", href: "/discover" }}
        />
      ) : (
        <MovieGrid>
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.entry.id}
                layout
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="space-y-3">
                  <MovieCard
                    tmdbId={item.movie.tmdbId}
                    title={item.movie.title}
                    year={item.movie.year}
                    overview={item.movie.overview}
                    posterPath={item.movie.posterPath}
                    rating={item.rating ?? null}
                    status={item.entry.status}
                  />
                  <WatchlistStatusPicker
                    tmdbId={item.movie.tmdbId}
                    value={item.entry.status}
                    onChange={(status) => updateStatus(item.movie.tmdbId, status)}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </MovieGrid>
      )}
    </div>
  );
}
