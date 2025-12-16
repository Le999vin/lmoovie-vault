"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WatchStatus } from "@/lib/db/queries";

const statuses: WatchStatus[] = ["planned", "watching", "watched", "dropped"];

export function WatchlistStatusPicker({
  tmdbId,
  value,
  onChange,
}: {
  tmdbId: number;
  value: WatchStatus;
  onChange?: (status: WatchStatus) => void;
}) {
  const [current, setCurrent] = useState<WatchStatus>(value);
  const [pending, startTransition] = useTransition();

  const setStatus = (status: WatchStatus) => {
    startTransition(async () => {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, status }),
      });
      setCurrent(status);
      onChange?.(status);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status}
          size="sm"
          className="rounded-full"
          variant={status === current ? "default" : "outline"}
          onClick={() => setStatus(status)}
          disabled={pending}
        >
          {pending && status === current ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {status}
        </Button>
      ))}
    </div>
  );
}
