import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Film, Star } from "lucide-react";

import { MovieActions } from "@/components/movie/movie-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getMoviePageData } from "@/lib/data/movies";
import { getImageUrl } from "@/lib/tmdb/client";
import { formatWatchStatus } from "@/lib/utils";

export const runtime = "nodejs";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const resolved = await Promise.resolve(params);
  const tmdbId = Number.parseInt(resolved.tmdbId, 10);
  if (Number.isNaN(tmdbId)) notFound();

  const session = await getAuthSession();
  const data = await getMoviePageData(tmdbId, session?.user?.id);

  if (!data.details) notFound();

  const posterUrl = getImageUrl(data.details.poster_path, "w500");
  const year = data.details.release_date?.split("-")[0];
  const genres = data.details.genres?.map((g) => g.name) ?? [];

  const collectionEntries = data.collections.map((collection) => ({
    id: collection.collection.id,
    name: collection.collection.name,
    movies: collection.movies.map((m) => ({ tmdbId: m.tmdbId })),
  }));

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[320px,1fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/50 shadow-card">
            {posterUrl ? (
              <Image src={posterUrl} alt={data.details.title ?? "Poster"} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Film className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 5).map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-semibold leading-tight">
                {data.details.title}
                {year ? <span className="text-muted-foreground"> | {year}</span> : null}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {data.details.runtime ? `${data.details.runtime} min` : "Runtime unknown"}
                {data.rating?.rating ? (
                  <span className="ml-2 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {data.rating.rating}/10
                  </span>
                ) : null}
              </div>
            </div>
            <p className="text-lg text-muted-foreground">{data.details.tagline}</p>
            <p className="text-base leading-relaxed text-foreground">{data.details.overview}</p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {data.watchlist ? (
                <Badge variant="secondary">{formatWatchStatus(data.watchlist.status)}</Badge>
              ) : null}
              {data.note ? <Badge variant="muted">Personal note saved</Badge> : null}
            </div>
          </div>

          {session?.user ? (
            <MovieActions
              tmdbId={tmdbId}
              genres={genres}
              runtime={data.details.runtime ?? null}
              initialStatus={data.watchlist?.status ?? null}
              initialRating={data.rating?.rating ?? null}
              initialNote={
                data.note
                  ? {
                      content: data.note.content,
                      spoiler: data.note.spoiler,
                    }
                  : null
              }
              collections={collectionEntries}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sign in to save</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p>Log in to add this film to your watchlist, rate it, leave notes, or add it to a collection.</p>
                <Link href="/ai" className="text-primary hover:underline">
                  Sign in from the AI page
                </Link>
              </CardContent>
            </Card>
          )}

          {collectionEntries.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Collections</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {collectionEntries.map((c) => (
                  <Badge key={c.id} variant="outline">
                    {c.name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
