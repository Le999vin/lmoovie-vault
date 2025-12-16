import { NextResponse } from "next/server";

import { searchMovies } from "@/lib/tmdb/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const year = searchParams.get("year");
  const genre = searchParams.get("genre");

  if (!query.trim()) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const data = await searchMovies(query, {
      page: Number.isNaN(page) ? 1 : page,
      year: year ? Number.parseInt(year, 10) : undefined,
      genre: genre ? Number.parseInt(genre, 10) : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB search failed", error);
    return NextResponse.json({ error: "TMDB request failed" }, { status: 500 });
  }
}
