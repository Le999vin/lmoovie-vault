import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { addMovieToCollection, getMovieByTmdbId, removeMovieFromCollection } from "@/lib/db/queries";
import { toMovieInput } from "@/lib/tmdb/client";
import { syncMovie } from "@/lib/tmdb/sync";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const tmdbId = Number.parseInt(body.tmdbId, 10);
  if (!tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
  }

  try {
    const { details } = await syncMovie(tmdbId);
    const movieInput = toMovieInput(details);
    const movie = await addMovieToCollection(session.user.id, id, movieInput);
    return NextResponse.json({ ok: true, movie });
  } catch (error) {
    console.error("Add movie to collection failed", error);
    return NextResponse.json({ error: "Add failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  await removeMovieFromCollection(session.user.id, id, movie.id);
  return NextResponse.json({ ok: true });
}
