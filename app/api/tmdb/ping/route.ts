import { NextResponse } from "next/server";

import { tmdbFetch } from "@/lib/tmdb/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await tmdbFetch<{ results: Array<unknown> }>("/search/movie", {
      query: { query: "Dune", page: 1 },
    });
    return NextResponse.json({ ok: true, resultsCount: data.results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
