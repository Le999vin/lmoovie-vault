import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";

import { MovieCard } from "@/components/movie/movie-card";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { MovieGrid } from "@/components/ui/movie-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDiscoverData } from "@/lib/data/movies";
import type { TMDBMovie } from "@/lib/tmdb/types";

type DiscoverSearchParams = {
  q?: string;
  page?: string;
  year?: string;
  genre?: string;
};

function getYear(movie: TMDBMovie) {
  const date = movie.release_date ?? movie.first_air_date;
  if (!date) return null;
  const year = Number.parseInt(date.split("-")[0] ?? "", 10);
  return Number.isNaN(year) ? null : year;
}

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const resolvedParams = (await Promise.resolve(searchParams)) ?? {};
  const pageParam = resolvedParams.page ?? "1";
  const yearParam = resolvedParams.year;
  const genreParam = resolvedParams.genre;
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : "";

  const parsedPage = Number.parseInt(String(pageParam), 10);
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
  const year =
    yearParam && !Number.isNaN(Number.parseInt(String(yearParam), 10))
      ? Number.parseInt(String(yearParam), 10)
      : undefined;
  const genre =
    genreParam && genreParam !== "any" && !Number.isNaN(Number.parseInt(String(genreParam), 10))
      ? Number.parseInt(String(genreParam), 10)
      : undefined;

  if (resolvedParams.page && (Number.isNaN(page) || page < 1)) {
    redirect("/discover");
  }

  const { genres, search, error } = await getDiscoverData({ query, page, year, genre });
  const hasQuery = Boolean(query.trim());
  const hasResults = search && search.results.length > 0;
  const prevDisabled = !search || page <= 1;
  const nextDisabled = !search || page >= (search?.total_pages ?? 1);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Discover"
        description="Search TMDB, filter by year and genre, then jump into details."
        action={<Badge variant="secondary">Powered by TMDB</Badge>}
        eyebrow="Explore"
      />

      <FilterBar query={query} year={year} genre={genre} genres={genres} />

      {error ? (
        <EmptyState
          icon={AlertCircle}
          title="TMDB nicht erreichbar"
          description="Wir konnten gerade keine Daten von TMDB laden. Bitte versuche es erneut."
          action={{ label: "Retry", href: "/discover" }}
        />
      ) : null}

      {hasResults ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <p>
              Showing <span className="font-medium text-foreground">{search?.results.length}</span> of{" "}
              <span className="font-medium text-foreground">{search?.total_results ?? 0}</span>{" "}
              {hasQuery ? (
                <>
                  results for <span className="font-semibold text-foreground">{query}</span>
                </>
              ) : (
                "popular picks"
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={prevDisabled}
                asChild={!prevDisabled}
              >
                {prevDisabled ? (
                  <span>Previous</span>
                ) : (
                  <Link
                    href={`/discover?q=${encodeURIComponent(query)}&page=${page - 1}${year ? `&year=${year}` : ""}${genre ? `&genre=${genre}` : ""}`}
                  >
                    Previous
                  </Link>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="rounded-full"
                disabled={nextDisabled}
                asChild={!nextDisabled}
              >
                {nextDisabled ? (
                  <span>Next</span>
                ) : (
                  <Link
                    href={`/discover?q=${encodeURIComponent(query)}&page=${page + 1}${year ? `&year=${year}` : ""}${genre ? `&genre=${genre}` : ""}`}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
            </div>
          </div>
        <MovieGrid key={`${query}-${year ?? "any"}-${genre ?? "any"}-${page}`}>
          {search?.results.map((movie) => (
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
        </div>
      ) : hasQuery ? (
        <EmptyState
          icon={AlertCircle}
          title={`No results for “${query}”`}
          description="Try adjusting your filters or clearing the search."
          action={{ label: "Clear filters", href: "/discover" }}
        />
      ) : (
        <Card className="glass border-dashed border-border/70 bg-white/70 p-6 text-muted-foreground">
          Start with a keyword to search TMDB. You can also filter by year or a specific genre.
        </Card>
      )}
    </div>
  );
}
