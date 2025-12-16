import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const watchStatusEnum = pgEnum("watch_status", ["planned", "watching", "watched", "dropped"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbId: integer("tmdb_id").notNull().unique(),
    title: text("title").notNull(),
    year: integer("year"),
    posterPath: text("poster_path"),
    genres: jsonb("genres").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    runtime: integer("runtime"),
    overview: text("overview"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tmdbIdx: uniqueIndex("movies_tmdb_idx").on(table.tmdbId),
  }),
);

export const watchlistEntries = pgTable(
  "watchlist_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    status: watchStatusEnum("status").notNull().default("planned"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    watchlistUnique: uniqueIndex("watchlist_user_movie_idx").on(table.userId, table.movieId),
  }),
);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ratingUnique: uniqueIndex("ratings_user_movie_idx").on(table.userId, table.movieId),
    ratingRange: check("ratings_range_check", sql`${table.rating} BETWEEN 1 AND 10`),
  }),
);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  movieId: uuid("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  spoiler: boolean("spoiler").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    collectionsNameIdx: uniqueIndex("collections_user_name_idx").on(table.userId, table.name),
  }),
);

export const collectionMovies = pgTable(
  "collection_movies",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.movieId] }),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  watchlist: many(watchlistEntries),
  ratings: many(ratings),
  notes: many(notes),
  collections: many(collections),
}));

export const movieRelations = relations(movies, ({ many }) => ({
  watchlistEntries: many(watchlistEntries),
  ratings: many(ratings),
  notes: many(notes),
  collectionEntries: many(collectionMovies),
}));

export const watchlistRelations = relations(watchlistEntries, ({ one }) => ({
  user: one(users, { fields: [watchlistEntries.userId], references: [users.id] }),
  movie: one(movies, { fields: [watchlistEntries.movieId], references: [movies.id] }),
}));

export const ratingRelations = relations(ratings, ({ one }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
  movie: one(movies, { fields: [ratings.movieId], references: [movies.id] }),
}));

export const noteRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  movie: one(movies, { fields: [notes.movieId], references: [movies.id] }),
}));

export const collectionRelations = relations(collections, ({ one, many }) => ({
  user: one(users, { fields: [collections.userId], references: [users.id] }),
  movies: many(collectionMovies),
}));

export const collectionMovieRelations = relations(collectionMovies, ({ one }) => ({
  collection: one(collections, { fields: [collectionMovies.collectionId], references: [collections.id] }),
  movie: one(movies, { fields: [collectionMovies.movieId], references: [movies.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type WatchlistEntry = typeof watchlistEntries.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type CollectionMovie = typeof collectionMovies.$inferSelect;
