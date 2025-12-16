"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Collection = {
  id: string;
  name: string;
  movies: { tmdbId: number; title: string }[];
};

export function CollectionsManager({ initial }: { initial: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initial);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const refreshMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2000);
  };

  const createCollection = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const { collection } = await res.json();
        setCollections((prev) => [...prev, { ...collection, movies: [] }]);
        setNewName("");
        refreshMessage("Collection created");
      }
    });
  };

  const renameCollection = (id: string, name: string) => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) {
        setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
        refreshMessage("Renamed");
      }
    });
  };

  const deleteCollection = (id: string) => {
    startTransition(async () => {
      const res = await fetch("/api/collections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        refreshMessage("Deleted");
      }
    });
  };

  const removeMovie = (collectionId: string, tmdbId: number) => {
    startTransition(async () => {
      const res = await fetch(`/api/collections/${collectionId}/movies`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId }),
      });
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId ? { ...c, movies: c.movies.filter((m) => m.tmdbId !== tmdbId) } : c,
          ),
        );
        refreshMessage("Removed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="New collection name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="sm:w-72"
        />
        <Button onClick={createCollection} disabled={!newName.trim() || pending}>
          Create
        </Button>
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {collections.map((collection) => (
          <Card key={collection.id} className="border-border/70 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Input
                  defaultValue={collection.name}
                  onBlur={(e) => renameCollection(collection.id, e.target.value)}
                  className="h-9 border-0 px-0 text-base font-semibold focus-visible:ring-0"
                />
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteCollection(collection.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {collection.movies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movies yet. Add one from a detail page.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {collection.movies.map((movie) => (
                    <Badge key={movie.tmdbId} variant="secondary" className="flex items-center gap-2">
                      <span>{movie.title}</span>
                      <button
                        type="button"
                        onClick={() => removeMovie(collection.id, movie.tmdbId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
