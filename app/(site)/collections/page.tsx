import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { CollectionsManager } from "@/components/collections/manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getCollectionsWithMovies } from "@/lib/db/queries";

export default async function CollectionsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Sign in to create and manage collections.</p>
          <Button asChild>
            <Link href="/ai">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const collections = await getCollectionsWithMovies(session.user.id);
  const data = collections.map((item) => ({
    id: item.collection.id,
    name: item.collection.name,
    movies: item.movies.map((movie) => ({
      tmdbId: movie.tmdbId,
      title: movie.title,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Collections</h1>
          <p className="text-muted-foreground">Organize your favorites into custom sets.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/discover">
            <FolderPlus className="mr-2 h-4 w-4" />
            Find movies
          </Link>
        </Button>
      </div>

      <CollectionsManager initial={data} />
    </div>
  );
}
