import Image from "next/image";
import Link from "next/link";
import { BookmarkCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WatchStatus } from "@/lib/db/queries";
import { getImageUrl } from "@/lib/tmdb/client";
import { formatWatchStatus } from "@/lib/utils";

type MovieCardProps = {
  tmdbId: number;
  title: string;
  year?: number | null;
  overview?: string | null;
  posterPath?: string | null;
  rating?: number | null;
  status?: WatchStatus | null;
  footnote?: string | null;
};

export function MovieCard({
  tmdbId,
  title,
  year,
  overview,
  posterPath,
  rating,
  status,
  footnote,
}: MovieCardProps) {
  const posterUrl = getImageUrl(posterPath, "w342");

  return (
    <Link href={`/movie/${tmdbId}`} className="group">
      <Card className="fade-border h-full overflow-hidden rounded-3xl border-transparent bg-white/80 shadow-xl transition duration-200 hover:-translate-y-1.5 hover:shadow-2xl">
        <div className="relative h-64 overflow-hidden">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(min-width: 1280px) 260px, (min-width: 1024px) 220px, 50vw"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-muted-foreground">
              <BookmarkCheck className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {status ? (
              <Badge className="rounded-full bg-white/85 text-[11px] font-semibold text-slate-800 shadow">
                {formatWatchStatus(status)}
              </Badge>
            ) : null}
            {footnote ? (
              <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow">
                {footnote}
              </span>
            ) : null}
          </div>
          {rating ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-3 py-1 text-xs text-white backdrop-blur">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </div>
          ) : null}
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-tight">{title}</h3>
            {year ? <p className="text-xs text-muted-foreground">{year}</p> : null}
          </div>
          {overview ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{overview}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Open details to see more.</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
