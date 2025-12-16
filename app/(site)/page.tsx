import Link from "next/link";
import { ArrowRight, Flame, Play, Search, Sparkles } from "lucide-react";

import { MovieCard } from "@/components/movie/movie-card";
import { SectionHeader } from "@/components/layout/section-header";
import { StatPill } from "@/components/ui/stat-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MovieGrid } from "@/components/ui/movie-grid";
import { getAuthSession } from "@/lib/auth";
import { getHomePageData } from "@/lib/data/movies";
import { formatWatchStatus } from "@/lib/utils";
import type { TMDBMovie } from "@/lib/tmdb/types";

function getYear(movie: TMDBMovie) {
  const date = movie.release_date ?? movie.first_air_date;
  if (!date) return null;
  const year = Number.parseInt(date.split("-")[0] ?? "", 10);
  return Number.isNaN(year) ? null : year;
}

export default async function HomePage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  const { trending, watchlistPreview, error } = await getHomePageData(userId);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-r from-white via-blue-50 to-cyan-50 p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute right-[-120px] top-10 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-7">
            <Badge className="flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/80 text-primary shadow-md">
              <Sparkles className="h-4 w-4" />
              Personalized picks, synced locally
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-[42px]">
                Build your movie vault, track your watchlist, and get AI-powered guidance.
              </h1>
              <p className="max-w-2xl text-lg text-slate-600">
                Search TMDB, sync titles into Postgres/Drizzle, and chat with an agent that understands your taste,
                collections, and notes.
              </p>
            </div>
            <form action="/discover" className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search movies, e.g. Blade Runner"
                  className="h-12 w-full rounded-2xl bg-white/90 pl-10 shadow-lg shadow-blue-500/10"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="h-12 rounded-2xl px-6 shadow-lg shadow-blue-500/20">
                  Discover
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white/70">
                  <Link href="/ai">
                    Ask the AI
                    <Play className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </form>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <StatPill icon={<Flame className="h-4 w-4 text-orange-500" />} label="Trending from TMDB" />
              <StatPill label="Local Postgres + Drizzle" />
              <StatPill label="AI agent via LangChain & OpenRouter" />
            </div>
          </div>

          <Card className="glass fade-border border-white/50 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Watchlist preview</CardTitle>
                <p className="text-sm text-muted-foreground">Latest from your vault.</p>
              </div>
              <Badge variant="secondary">{watchlistPreview.length} saved</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {watchlistPreview.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-white/60 p-4 text-sm text-muted-foreground">
                  {userId ? (
                    <p>Nothing in your vault yet. Add a title from Discover or a detail page to see it here.</p>
                  ) : (
                    <p>Sign in to start a personal watchlist and save notes.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlistPreview.map((item) => (
                    <Link
                      key={item.movie.id}
                      href={`/movie/${item.movie.tmdbId}`}
                      className="flex items-center justify-between rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >
                      <div>
                        <p className="font-medium leading-tight">{item.movie.title}</p>
                        <p className="text-xs text-muted-foreground">{item.movie.year ?? "Unknown year"}</p>
                      </div>
                      <Badge variant="secondary">{formatWatchStatus(item.entry.status)}</Badge>
                    </Link>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <Button asChild variant="outline" className="w-full rounded-2xl border-slate-200 bg-white/80">
                  <Link href="/watchlist">
                    Open watchlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4" id="trending">
        <SectionHeader
          title="Trending this week"
          description="Fresh from TMDB, updated daily."
          action={
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/discover">
                Discover more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        {error ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-white/70 p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : null}
        <MovieGrid>
          {trending.slice(0, 8).map((movie) => (
            <MovieCard
              key={movie.id}
              tmdbId={movie.id}
              title={movie.title ?? movie.name ?? "Untitled"}
              posterPath={movie.poster_path}
              overview={movie.overview}
              year={getYear(movie)}
            />
          ))}
        </MovieGrid>
      </section>
    </div>
  );
}
