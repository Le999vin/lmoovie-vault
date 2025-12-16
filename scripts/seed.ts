import "dotenv/config";

import { eq } from "drizzle-orm";

import { db, pool } from "../lib/db/client";
import {
  collectionMovies,
  collections,
  movies,
  notes,
  ratings,
  users,
  watchlistEntries,
  type Movie,
  type User,
} from "../lib/db/schema";

async function ensureUser(): Promise<User> {
  const email = process.env.SINGLE_USER_EMAIL ?? "demo@movievault.local";
  const name = process.env.SINGLE_USER_NAME ?? "Demo User";

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;

  const [user] = await db
    .insert(users)
    .values({ email, name })
    .returning();
  return user;
}

async function upsertMovies(entries: Array<Partial<Movie> & { tmdbId: number; title: string }>) {
  for (const entry of entries) {
    await db
      .insert(movies)
      .values({
        title: entry.title,
        tmdbId: entry.tmdbId,
        year: entry.year ?? null,
        posterPath: entry.posterPath ?? null,
        overview: entry.overview ?? null,
        runtime: entry.runtime ?? null,
        genres: entry.genres ?? [],
      })
      .onConflictDoUpdate({
        target: movies.tmdbId,
        set: {
          title: entry.title,
          year: entry.year ?? null,
          posterPath: entry.posterPath ?? null,
          overview: entry.overview ?? null,
          runtime: entry.runtime ?? null,
          genres: entry.genres ?? [],
          updatedAt: new Date(),
        },
      });
  }
}

async function main() {
  const user = await ensureUser();

  const sampleMovies: Array<Partial<Movie> & { tmdbId: number; title: string }> = [
    {
      tmdbId: 550,
      title: "Fight Club",
      year: 1999,
      posterPath: "/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg",
      overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
      genres: ["Drama"],
      runtime: 139,
    },
    {
      tmdbId: 278,
      title: "The Shawshank Redemption",
      year: 1994,
      posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      genres: ["Drama", "Crime"],
      runtime: 142,
    },
    {
      tmdbId: 680,
      title: "Pulp Fiction",
      year: 1994,
      posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      overview: "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
      genres: ["Crime", "Drama"],
      runtime: 154,
    },
  ];

  await upsertMovies(sampleMovies);

  const fightClub = await db.query.movies.findFirst({ where: eq(movies.tmdbId, 550) });
  const shawshank = await db.query.movies.findFirst({ where: eq(movies.tmdbId, 278) });
  const pulpFiction = await db.query.movies.findFirst({ where: eq(movies.tmdbId, 680) });

  const movieMap: Record<number, Movie | undefined> = {
    550: fightClub ?? undefined,
    278: shawshank ?? undefined,
    680: pulpFiction ?? undefined,
  };

  for (const tmdbId of [550, 278, 680]) {
    const movie = movieMap[tmdbId];
    if (!movie) continue;
    await db
      .insert(watchlistEntries)
      .values({
        movieId: movie.id,
        userId: user.id,
        status: tmdbId === 550 ? "watched" : "planned",
      })
      .onConflictDoUpdate({
        target: [watchlistEntries.userId, watchlistEntries.movieId],
        set: { status: tmdbId === 550 ? "watched" : "planned" },
      });
  }

  if (fightClub) {
    await db
      .insert(ratings)
      .values({ movieId: fightClub.id, userId: user.id, rating: 9 })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.movieId],
        set: { rating: 9 },
      });

    await db.insert(notes).values({
      movieId: fightClub.id,
      userId: user.id,
      content: "Rewatch-worthy and darker than I remember.",
      spoiler: false,
    });
  }

  if (pulpFiction) {
    const [collection] = await db
      .insert(collections)
      .values({ name: "Tarantino Night", userId: user.id })
      .onConflictDoUpdate({
        target: [collections.userId, collections.name],
        set: { name: "Tarantino Night" },
      })
      .returning();

    await db
      .insert(collectionMovies)
      .values({ collectionId: collection.id, movieId: pulpFiction.id })
      .onConflictDoNothing();
  }

  console.log("Seed complete for", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
