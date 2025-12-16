import { Skeleton } from "@/components/ui/skeleton";

export function MovieGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="space-y-3 pt-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton key={idx} className="h-4 w-full" />
      ))}
    </div>
  );
}
