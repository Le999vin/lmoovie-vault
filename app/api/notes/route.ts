import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { saveNote } from "@/lib/db/queries";
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
  const content = (body.content as string | undefined)?.trim() ?? "";
  const spoiler = Boolean(body.spoiler);

  if (!tmdbId || !content) {
    return NextResponse.json({ error: "Missing tmdbId or content" }, { status: 400 });
  }

  try {
    const { details } = await syncMovie(tmdbId);
    const movieInput = toMovieInput(details);
    const note = await saveNote(session.user.id, movieInput, content, spoiler);
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    console.error("Failed to save note", error);
    return NextResponse.json({ error: "Note save failed" }, { status: 500 });
  }
}
