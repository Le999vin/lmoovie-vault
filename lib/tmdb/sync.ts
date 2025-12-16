import { upsertMovie } from "@/lib/db/queries";

import { getMovieDetails, toMovieInput } from "./client";

export async function syncMovie(tmdbId: number) {
  const details = await getMovieDetails(tmdbId);
  const movie = await upsertMovie(toMovieInput(details));
  return { movie, details };
}
