"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Check, ListPlus, Loader2, NotebookText, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WatchStatus } from "@/lib/db/queries";

type CollectionEntry = {
  id: string;
  name: string;
  movies: { tmdbId: number }[];
};

type MovieActionsProps = {
  tmdbId: number;
  genres: string[];
  runtime?: number | null;
  initialStatus?: WatchStatus | null;
  initialRating?: number | null;
  initialNote?: { content: string; spoiler: boolean } | null;
  collections: CollectionEntry[];
};

const statusOptions: WatchStatus[] = ["planned", "watching", "watched", "dropped"];

export function MovieActions({
  tmdbId,
  genres,
  runtime,
  initialStatus,
  initialRating,
  initialNote,
  collections: initialCollections,
}: MovieActionsProps) {
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus ?? null);
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [note, setNote] = useState(initialNote?.content ?? "");
  const [spoiler, setSpoiler] = useState(initialNote?.spoiler ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [collections, setCollections] = useState<CollectionEntry[]>(initialCollections);
  const [newCollection, setNewCollection] = useState("");
  const [pending, startTransition] = useTransition();

  const postJson = async (url: string, method: string, payload: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Request failed");
    }
    return res.json();
  };

  const handleStatusChange = (nextStatus: WatchStatus) => {
    startTransition(async () => {
      try {
        await postJson("/api/watchlist", "POST", { tmdbId, status: nextStatus });
        setStatus(nextStatus);
        setMessage(`Saved as ${nextStatus}`);
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  const handleRating = (value: number) => {
    startTransition(async () => {
      try {
        await postJson("/api/ratings", "POST", { tmdbId, rating: value });
        setRating(value);
        setMessage("Rating saved");
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  const handleNote = () => {
    if (!note.trim()) return;
    startTransition(async () => {
      try {
        await postJson("/api/notes", "POST", { tmdbId, content: note, spoiler });
        setMessage("Note saved");
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  const handleCreateCollection = () => {
    if (!newCollection.trim()) return;
    startTransition(async () => {
      try {
        const result = await postJson("/api/collections", "POST", { name: newCollection });
        setCollections((prev) => [...prev, { ...result.collection, movies: [] }]);
        setSelectedCollection(result.collection.id);
        setNewCollection("");
        setMessage("Collection created");
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  const handleAddToCollection = () => {
    if (!selectedCollection) return;
    startTransition(async () => {
      try {
        await postJson(`/api/collections/${selectedCollection}/movies`, "POST", { tmdbId });
        setCollections((prev) =>
          prev.map((c) =>
            c.id === selectedCollection ? { ...c, movies: [...c.movies, { tmdbId }] } : c,
          ),
        );
        setMessage("Added to collection");
      } catch (error) {
        setMessage((error as Error).message);
      }
    });
  };

  const inSelectedCollection = collections
    .find((c) => c.id === selectedCollection)
    ?.movies.some((m) => m.tmdbId === tmdbId);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Watchlist & rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <Button
                key={s}
                variant={status === s ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(s)}
                disabled={pending}
              >
                {status === s ? <Check className="mr-2 h-4 w-4" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
                {s}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-10)</Label>
            <div className="flex items-center gap-3">
              <input
                id="rating"
                type="range"
                min={1}
                max={10}
                value={rating ?? 5}
                className="w-full accent-primary"
                onChange={(e) => setRating(Number.parseInt(e.target.value, 10))}
                onMouseUp={(e) => handleRating(Number.parseInt((e.target as HTMLInputElement).value, 10))}
                onTouchEnd={(e) => handleRating(Number.parseInt((e.target as HTMLInputElement).value, 10))}
              />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-400" />
                {rating ?? "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {runtime ? `${runtime} min | ` : null}
              {genres.slice(0, 3).join(", ")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Personal note</Label>
            <Textarea
              id="note"
              placeholder="What stood out? Any spoilers to remember?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Contains spoilers
            </label>
            <Button onClick={handleNote} disabled={pending || !note.trim()} size="sm">
              <NotebookText className="mr-2 h-4 w-4" />
              Save note
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Add to collection</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddToCollection}
                disabled={!selectedCollection || inSelectedCollection || pending}
                className="w-full sm:w-auto"
              >
                <ListPlus className="mr-2 h-4 w-4" />
                {inSelectedCollection ? "Already added" : "Add"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="New collection name"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
              />
              <Button onClick={handleCreateCollection} variant="outline" disabled={!newCollection.trim() || pending}>
                Create
              </Button>
            </div>
          </div>
          {pending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Working...
            </p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
