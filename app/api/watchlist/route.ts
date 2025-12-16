import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { removeFromWatchlist, setWatchlistStatus, type WatchStatus } from "@/lib/db/queries";
import { getMovieByTmdbId } from "@/lib/db/queries";
import { toMovieInput } from "@/lib/tmdb/client";
import { syncMovie } from "@/lib/tmdb/sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const tmdbId = Number.parseInt(body.tmdbId, 10);
  const status = body.status as WatchStatus | undefined;

  if (!tmdbId || !status) {
    return NextResponse.json({ error: "Missing tmdbId or status" }, { status: 400 });
  }

  try {
    const { details } = await syncMovie(tmdbId);
    const movieInput = toMovieInput(details);
    const entry = await setWatchlistStatus(session.user.id, movieInput, status);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("Failed to update watchlist", error);
    return NextResponse.json({ error: "Watchlist update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const tmdbId = Number.parseInt(body.tmdbId, 10);
  if (!tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
  }

  const movie = await getMovieByTmdbId(tmdbId);
  if (!movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  await removeFromWatchlist(session.user.id, movie.id);
  return NextResponse.json({ ok: true });
}
