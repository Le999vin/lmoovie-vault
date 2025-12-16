import { afterAll, describe, expect, it } from "vitest";

import { pool } from "@/lib/db/client";
import { ensureUser, setRatingValue, setWatchlistStatus } from "@/lib/db/queries";

const sampleMovie = {
  tmdbId: 999999,
  title: "Test Movie",
  year: 2025,
  overview: "Test data",
};

describe("database helpers", () => {
  it("creates a watchlist entry and rating", async () => {
    const user = await ensureUser(`test-${Date.now()}@movievault.local`, "Test User");
    const entry = await setWatchlistStatus(user.id, sampleMovie, "planned");
    expect(entry.status).toBe("planned");

    const rating = await setRatingValue(user.id, sampleMovie, 7);
    expect(rating.rating).toBe(7);
  });
});

afterAll(async () => {
  await pool.end();
});
