import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { setRatingValue } from "@/lib/db/queries";
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
  const ratingValue = Number.parseInt(body.rating, 10);

  if (!tmdbId || Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
    return NextResponse.json({ error: "Invalid tmdbId or rating" }, { status: 400 });
  }

  try {
    const { details } = await syncMovie(tmdbId);
    const movieInput = toMovieInput(details);
    const rating = await setRatingValue(session.user.id, movieInput, ratingValue);
    return NextResponse.json({ ok: true, rating });
  } catch (error) {
    console.error("Failed to set rating", error);
    return NextResponse.json({ error: "Rating update failed" }, { status: 500 });
  }
}
