import { ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TMDBGenre } from "@/lib/tmdb/types";

type FilterBarProps = {
  query: string;
  year?: number;
  genre?: number;
  genres: TMDBGenre[];
};

export function FilterBar({ query, year, genre, genres }: FilterBarProps) {
  return (
    <Card className="glass fade-border border-transparent shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>Search & Filters</span>
          <span className="text-xs font-medium text-muted-foreground">Powered by TMDB</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto,auto]" action="/discover">
          <Input
            name="q"
            placeholder="Dune, Interstellar, John Wick..."
            defaultValue={query}
            className="h-12 rounded-xl bg-white/80"
          />
          <Input
            name="year"
            placeholder="Year"
            inputMode="numeric"
            defaultValue={year ?? ""}
            className="h-12 rounded-xl bg-white/80"
          />
          <Select name="genre" defaultValue={genre ? String(genre) : "any"}>
            <SelectTrigger className="h-12 rounded-xl bg-white/80">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Genres</SelectLabel>
                <SelectItem value="any">Any</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="submit" className="h-12 rounded-xl px-6 shadow-lg shadow-blue-500/10">
            Search
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" type="button" asChild className="h-12 rounded-xl px-4">
            <a href="/discover" className="inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Clear
            </a>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
