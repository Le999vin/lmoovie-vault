import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import { db } from "./client";
import {
  collectionMovies,
  collections,
  movies,
  notes,
  ratings,
  users,
  watchStatusEnum,
  watchlistEntries,
  type Collection,
  type Movie,
  type Note,
  type Rating,
  type User,
  type WatchlistEntry,
} from "./schema";

export type WatchStatus = (typeof watchStatusEnum.enumValues)[number];

export type MovieInput = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterPath?: string | null;
  overview?: string | null;
  runtime?: number | null;
  genres?: string[] | null;
};

export async function ensureUser(email: string, name?: string): Promise<User> {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;

  const [user] = await db
    .insert(users)
    .values({ email, name })
    .returning();

  return user;
}

export async function upsertMovie(payload: MovieInput): Promise<Movie> {
  const [movie] = await db
    .insert(movies)
    .values({
      tmdbId: payload.tmdbId,
      title: payload.title,
      year: payload.year ?? null,
      posterPath: payload.posterPath ?? null,
      overview: payload.overview ?? null,
      runtime: payload.runtime ?? null,
      genres: payload.genres ?? [],
    })
    .onConflictDoUpdate({
      target: movies.tmdbId,
      set: {
        title: payload.title,
        year: payload.year ?? null,
        posterPath: payload.posterPath ?? null,
        overview: payload.overview ?? null,
        runtime: payload.runtime ?? null,
        genres: payload.genres ?? [],
        updatedAt: new Date(),
      },
    })
    .returning();

  return movie;
}

export async function getMovieByTmdbId(tmdbId: number) {
  return db.query.movies.findFirst({ where: eq(movies.tmdbId, tmdbId) });
}

export async function setWatchlistStatus(
  userId: string,
  movieInput: MovieInput,
  status: WatchStatus,
): Promise<WatchlistEntry> {
  const movie = await upsertMovie(movieInput);

  const [entry] = await db
    .insert(watchlistEntries)
    .values({ userId, movieId: movie.id, status })
    .onConflictDoUpdate({
      target: [watchlistEntries.userId, watchlistEntries.movieId],
      set: { status },
    })
    .returning();

  return entry;
}

export async function removeFromWatchlist(userId: string, movieId: string) {
  await db
    .delete(watchlistEntries)
    .where(and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, movieId)));
}

export async function setRatingValue(
  userId: string,
  movieInput: MovieInput,
  ratingValue: number,
): Promise<Rating> {
  const movie = await upsertMovie(movieInput);

  const [rating] = await db
    .insert(ratings)
    .values({ userId, movieId: movie.id, rating: ratingValue })
    .onConflictDoUpdate({
      target: [ratings.userId, ratings.movieId],
      set: { rating: ratingValue },
    })
    .returning();

  return rating;
}

export async function saveNote(
  userId: string,
  movieInput: MovieInput,
  content: string,
  spoiler: boolean,
): Promise<Note> {
  const movie = await upsertMovie(movieInput);

  const [note] = await db
    .insert(notes)
    .values({ userId, movieId: movie.id, content, spoiler })
    .returning();

  return note;
}

export async function getWatchlistWithMeta(userId: string, status?: WatchStatus, limit?: number) {
  const query = db
    .select({
      entry: watchlistEntries,
      movie: movies,
      rating: ratings.rating,
      note: notes.content,
    })
    .from(watchlistEntries)
    .innerJoin(movies, eq(watchlistEntries.movieId, movies.id))
    .leftJoin(ratings, and(eq(ratings.userId, userId), eq(ratings.movieId, watchlistEntries.movieId)))
    .leftJoin(notes, and(eq(notes.userId, userId), eq(notes.movieId, watchlistEntries.movieId)))
    .where(
      status
        ? and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.status, status))
        : eq(watchlistEntries.userId, userId),
    )
    .orderBy(desc(watchlistEntries.createdAt));

  const rows = typeof limit === "number" ? await query.limit(limit) : await query;

  return rows;
}

export async function getCollectionsWithMovies(userId: string) {
  const results = await db
    .select({
      collection: collections,
      movie: movies,
    })
    .from(collections)
    .leftJoin(collectionMovies, eq(collectionMovies.collectionId, collections.id))
    .leftJoin(movies, eq(collectionMovies.movieId, movies.id))
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.createdAt));

  const grouped: Record<string, { collection: Collection; movies: Movie[] }> = {};
  for (const row of results) {
    const key = row.collection.id;
    if (!grouped[key]) {
      grouped[key] = { collection: row.collection, movies: [] };
    }
    if (row.movie) grouped[key].movies.push(row.movie);
  }

  return Object.values(grouped);
}

export async function createCollection(userId: string, name: string): Promise<Collection> {
  const [collection] = await db
    .insert(collections)
    .values({ userId, name })
    .onConflictDoUpdate({
      target: [collections.userId, collections.name],
      set: { name, createdAt: new Date() },
    })
    .returning();

  return collection;
}

export async function deleteCollection(userId: string, collectionId: string) {
  await db.delete(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
}

export async function renameCollection(userId: string, collectionId: string, name: string) {
  await db
    .update(collections)
    .set({ name })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
}

export async function addMovieToCollection(
  userId: string,
  collectionId: string,
  movieInput: MovieInput,
) {
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, userId)),
  });
  if (!collection) throw new Error("Collection not found for this user");

  const movie = await upsertMovie(movieInput);

  await db
    .insert(collectionMovies)
    .values({ collectionId, movieId: movie.id })
    .onConflictDoNothing();

  return movie;
}

export async function removeMovieFromCollection(userId: string, collectionId: string, movieId: string) {
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, userId)),
  });
  if (!collection) throw new Error("Collection not found for this user");

  await db
    .delete(collectionMovies)
    .where(and(eq(collectionMovies.collectionId, collectionId), eq(collectionMovies.movieId, movieId)));
}

export async function searchMyMovies(userId: string, query: string, limit = 10) {
  if (!query.trim()) return [];
  return db
    .select({
      movie: movies,
      rating: ratings.rating,
      status: watchlistEntries.status,
    })
    .from(movies)
    .leftJoin(ratings, and(eq(ratings.userId, userId), eq(ratings.movieId, movies.id)))
    .leftJoin(watchlistEntries, and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, movies.id)))
    .where(ilike(movies.title, `%${query}%`))
    .orderBy(desc(ratings.rating), desc(movies.updatedAt))
    .limit(limit);
}

export async function getMyTasteProfile(userId: string) {
  const rated = await db
    .select({
      rating: ratings.rating,
      genres: movies.genres,
      runtime: movies.runtime,
    })
    .from(ratings)
    .innerJoin(movies, eq(ratings.movieId, movies.id))
    .where(eq(ratings.userId, userId));

  if (!rated.length) {
    return { averageRating: null, ratedCount: 0, topGenres: [], medianRuntime: null };
  }

  const averageRating = rated.reduce((acc, r) => acc + r.rating, 0) / rated.length;
  const runtimes = rated.map((r) => r.runtime).filter((r): r is number => r != null).sort((a, b) => a - b);
  const medianRuntime =
    runtimes.length === 0
      ? null
      : runtimes.length % 2 === 0
        ? (runtimes[runtimes.length / 2 - 1] + runtimes[runtimes.length / 2]) / 2
        : runtimes[Math.floor(runtimes.length / 2)];

  const genreScores = new Map<string, number>();
  for (const item of rated) {
    const genresArr = Array.isArray(item.genres) ? (item.genres as string[]) : [];
    for (const genre of genresArr) {
      genreScores.set(genre, (genreScores.get(genre) ?? 0) + item.rating);
    }
  }
  const topGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, score]) => ({ name, score }));

  return { averageRating, ratedCount: rated.length, topGenres, medianRuntime };
}

export async function suggestTonight(
  userId: string,
  options: {
    mood?: string;
    maxMinutes?: number;
    avoidGenres?: string[];
    yearRange?: [number, number];
  },
) {
  const conditions = [sql`true`];
  if (options.maxMinutes) {
    conditions.push(sql`${movies.runtime} <= ${options.maxMinutes}`);
  }
  if (options.yearRange) {
    const [start, end] = options.yearRange;
    conditions.push(sql`${movies.year} BETWEEN ${start ?? 1900} AND ${end ?? new Date().getFullYear()}`);
  }

  const candidates = await db
    .select({
      movie: movies,
      rating: ratings.rating,
      status: watchlistEntries.status,
    })
    .from(movies)
    .leftJoin(ratings, and(eq(ratings.userId, userId), eq(ratings.movieId, movies.id)))
    .leftJoin(watchlistEntries, and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, movies.id)))
    .where(and(...conditions))
    .orderBy(desc(ratings.rating), desc(movies.updatedAt))
    .limit(25);
  const avoid = new Set((options.avoidGenres ?? []).map((g) => g.toLowerCase()));

  const filtered = candidates.filter(({ movie }) => {
    const genres = (movie.genres ?? []).map((g) => g.toLowerCase());
    if (avoid.size && genres.some((g) => avoid.has(g))) return false;
    return true;
  });

  return filtered.slice(0, 5).map(({ movie, rating, status }) => ({
    title: movie.title,
    year: movie.year,
    runtime: movie.runtime,
    rating,
    status,
  }));
}

export async function moviesNeedingSync(tmdbIds: number[]) {
  if (tmdbIds.length === 0) return [];
  const rows = await db.select({ tmdbId: movies.tmdbId }).from(movies).where(inArray(movies.tmdbId, tmdbIds));
  return tmdbIds.filter((id) => !rows.some((row) => row.tmdbId === id));
}
