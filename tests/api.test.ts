import { describe, expect, it } from "vitest";

import { POST as watchlistPost } from "@/app/api/watchlist/route";

describe("API auth", () => {
  it("requires auth for watchlist updates", async () => {
    const res = await watchlistPost(
      new Request("http://localhost/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ tmdbId: 123, status: "planned" }),
      }),
    );

    expect(res.status).toBe(401);
  });
});
