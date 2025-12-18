import { Skeleton } from '@/components/ui/skeleton';

export function MediaCardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden rounded-xl bg-zinc-700 p-4 animate-pulse">
      {/* Poster skeleton */}
      <div className="aspect-[2/3] w-24 shrink-0 rounded-lg bg-zinc-600" />

      {/* Info skeleton */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 bg-zinc-600" />
        
        {/* Meta info */}
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-3 w-12 bg-zinc-600" />
          <Skeleton className="h-3 w-20 bg-zinc-600" />
        </div>

        {/* Available on label */}
        <Skeleton className="mt-4 h-3 w-20 bg-zinc-600" />
        
        {/* Streaming platforms */}
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg bg-zinc-600" />
          <Skeleton className="h-10 w-10 rounded-lg bg-zinc-600" />
          <Skeleton className="h-10 w-10 rounded-lg bg-zinc-600" />
        </div>

        {/* Action button */}
        <div className="mt-auto pt-3">
          <Skeleton className="h-8 w-28 rounded-md bg-zinc-600" />
        </div>
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}
