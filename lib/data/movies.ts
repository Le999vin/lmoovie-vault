import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { notes, ratings, watchlistEntries } from "@/lib/db/schema";
import { getCollectionsWithMovies, getWatchlistWithMeta } from "@/lib/db/queries";
import { discoverMovies, getGenres, getTrendingMovies, searchMovies } from "@/lib/tmdb/client";
import { syncMovie } from "@/lib/tmdb/sync";
import type { TMDBSearchResponse } from "@/lib/tmdb/types";

const hasTmdb = Boolean(process.env.TMDB_ACCESS_TOKEN);

export async function getHomePageData(userId?: string) {
  const [trendingResult, watchlistPreview] = await Promise.allSettled([
    hasTmdb ? getTrendingMovies() : Promise.resolve({ results: [] }),
    userId ? getWatchlistWithMeta(userId, undefined, 4) : Promise.resolve([]),
  ]);

  const trending =
    trendingResult.status === "fulfilled"
      ? trendingResult.value.results
      : (console.error("Trending fetch failed", trendingResult.reason), []);

  const watchlist = watchlistPreview.status === "fulfilled" ? watchlistPreview.value : [];
  const error =
    trendingResult.status === "rejected"
      ? "TMDB nicht erreichbar - Trending wird uebersprungen."
      : null;

  return { trending, watchlistPreview: watchlist, error };
}

export async function getDiscoverData(params: {
  query?: string;
  page?: number;
  year?: number;
  genre?: number;
}): Promise<{ search: TMDBSearchResponse | null; genres: Awaited<ReturnType<typeof getGenres>>; error: string | null }> {
  if (!hasTmdb) {
    const message = "TMDB_ACCESS_TOKEN fehlt - keine Treffer verfuegbar.";
    console.error(message);
    return { genres: [], search: null, error: message };
  }
  const trimmedQuery = params.query?.trim() ?? "";
  const [genresResult, searchResult] = await Promise.allSettled([
    getGenres(),
    trimmedQuery
      ? searchMovies(trimmedQuery, { page: params.page, year: params.year, genre: params.genre })
      : discoverMovies({ page: params.page, year: params.year, genre: params.genre }),
  ]);

  const genres =
    genresResult.status === "fulfilled"
      ? genresResult.value
      : (console.error("TMDB genres failed", genresResult.reason), []);

  const search =
    searchResult.status === "fulfilled"
      ? searchResult.value
      : (console.error("TMDB search failed", searchResult.reason), null);

  const error =
    genresResult.status === "rejected" || searchResult.status === "rejected"
      ? "TMDB nicht erreichbar - Anzeigen sind ggf. leer."
      : null;

  return { genres, search, error };
}

export async function getMoviePageData(tmdbId: number, userId?: string) {
  let details;
  let movie;
  try {
    const synced = await syncMovie(tmdbId);
    details = synced.details;
    movie = synced.movie;
  } catch (error) {
    console.error("TMDB sync failed", error);
    return { details: null, movie: null, watchlist: null, rating: null, note: null, collections: [] };
  }

  if (!userId) {
    return { details, movie, watchlist: null, rating: null, note: null, collections: [] };
  }

  const [watchlist, rating, note, userCollections] = await Promise.all([
    db.query.watchlistEntries.findFirst({
      where: and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, movie.id)),
    }),
    db.query.ratings.findFirst({
      where: and(eq(ratings.userId, userId), eq(ratings.movieId, movie.id)),
    }),
    db.query.notes.findFirst({
      where: and(eq(notes.userId, userId), eq(notes.movieId, movie.id)),
    }),
    getCollectionsWithMovies(userId),
  ]);

  return { details, movie, watchlist, rating, note, collections: userCollections };
}

export async function getCollectionsForUser(userId: string) {
  return getCollectionsWithMovies(userId);
}
