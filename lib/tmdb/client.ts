import { cache } from "react";

import type { MovieInput } from "@/lib/db/queries";

import type { TMDBGenre, TMDBMovieDetails, TMDBSearchResponse } from "./types";

const TMDB_BASE_URL = (process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3").replace(/\/$/, "");
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const allowInsecure = process.env.TMDB_ALLOW_INSECURE === "1";
if (allowInsecure) {
  // Dev-only opt-out for corporate proxies.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

if (!TMDB_TOKEN) {
  console.warn("TMDB_ACCESS_TOKEN is not set. TMDB requests will fail until you add it.");
}

type FetchOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  cacheSeconds?: number;
  timeoutMs?: number;
  noStore?: boolean;
};

export async function tmdbFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (!TMDB_TOKEN) {
    return Promise.reject(new Error("TMDB_ACCESS_TOKEN missing"));
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${TMDB_BASE_URL}${normalizedPath}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${TMDB_TOKEN}`,
      },
      signal: controller.signal,
      ...(options.noStore || options.cacheSeconds === 0
        ? { cache: "no-store" as const }
        : { next: { revalidate: options.cacheSeconds ?? 60 } }),
    });

    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      const body = await res.text();
      return Promise.reject(
        new Error(`TMDB auth failed (${res.status}): Token ungueltig oder fehlt. Detail: ${body.slice(0, 200)}`),
      );
    }

    if (!res.ok) {
      const body = await res.text();
      return Promise.reject(
        new Error(`TMDB request failed (${res.status} ${res.statusText}) for ${path}. Body: ${body.slice(0, 200)}`),
      );
    }

    return res.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeout);
    const code = (error as Error & { code?: string }).code;
    const cause = code ? ` (code: ${code})` : "";
    const message = error instanceof Error ? `${error.message}${cause}` : String(error);
    return Promise.reject(new Error(`TMDB fetch error (${path}): ${message}`));
  }
}

export const getTrendingMovies = cache(async () => {
  return tmdbFetch<TMDBSearchResponse>("/trending/movie/week", { cacheSeconds: 3600 });
});

export async function searchMovies(query: string, opts: { page?: number; year?: number; genre?: number }) {
  return tmdbFetch<TMDBSearchResponse>("/search/movie", {
    query: {
      query,
      include_adult: false,
      language: "en-US",
      page: opts.page ?? 1,
      year: opts.year,
      with_genres: opts.genre,
    },
    cacheSeconds: 0,
    noStore: true,
  });
}

export async function discoverMovies(opts: { page?: number; year?: number; genre?: number }) {
  return tmdbFetch<TMDBSearchResponse>("/discover/movie", {
    query: {
      include_adult: false,
      language: "en-US",
      sort_by: "popularity.desc",
      page: opts.page ?? 1,
      primary_release_year: opts.year,
      with_genres: opts.genre,
    },
    cacheSeconds: 0,
    noStore: true,
  });
}

export const getMovieDetails = cache(async (tmdbId: number) => {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${tmdbId}`, {
    query: { append_to_response: "videos,credits,recommendations" },
    cacheSeconds: 300,
  });
});

export const getGenres = cache(async () => {
  const res = await tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list", { cacheSeconds: 86400 });
  return res.genres;
});

export function toMovieInput(movie: TMDBMovieDetails): MovieInput {
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? Number.parseInt(releaseDate.split("-")[0] ?? "", 10) : null;

  return {
    tmdbId: movie.id,
    title: movie.title ?? movie.name ?? "Untitled",
    year: Number.isNaN(year) ? null : year,
    posterPath: movie.poster_path,
    overview: movie.overview,
    runtime: movie.runtime ?? null,
    genres: movie.genres?.map((g) => g.name) ?? [],
  };
}

export function getImageUrl(path: string | null | undefined, size: "w200" | "w342" | "w500" | "original" = "w500") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
