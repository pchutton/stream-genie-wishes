import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MediaCard, MediaItem } from './MediaCard';
import { Loader2 } from 'lucide-react';

interface VirtualizedMediaGridProps {
  items: MediaItem[];
  isInWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv') => boolean;
  isWatched: (tmdbId: number, mediaType: 'movie' | 'tv') => boolean;
  onAddToWatchlist: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem) => void;
  onShowDetails: (item: MediaItem) => void;
  onPrefetchDetails?: (item: MediaItem) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function VirtualizedMediaGrid({
  items,
  isInWatchlist,
  isWatched,
  onAddToWatchlist,
  onToggleWatched,
  onShowDetails,
  onPrefetchDetails,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualizedMediaGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualize flat items - no row grouping, no resize issues
  const virtualizer = useVirtualizer({
    count: items.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 260, // MediaCard estimated height
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll trigger
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    
    if (lastItem.index >= items.length - 1 && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-280px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoader = virtualItem.index === items.length;

          if (isLoader) {
            return (
              <div
                key="loader"
                className="absolute left-0 w-full flex justify-center items-center py-6"
                style={{
                  top: 0,
                  transform: `translateY(${virtualItem.start}px)`,
                  height: `${virtualItem.size}px`,
                }}
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Scroll for more</span>
                )}
              </div>
            );
          }

          const item = items[virtualItem.index];

          return (
            <div
              key={`${item.media_type}-${item.tmdb_id}`}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 w-full pb-4"
              style={{
                top: 0,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MediaCard
                item={item}
                isInWatchlist={isInWatchlist(item.tmdb_id, item.media_type)}
                isWatched={isWatched(item.tmdb_id, item.media_type)}
                onAddToWatchlist={() => onAddToWatchlist(item)}
                onToggleWatched={() => onToggleWatched(item)}
                onShowDetails={() => onShowDetails(item)}
                onPrefetchDetails={() => onPrefetchDetails?.(item)}
              />
            </div>
          );
        })}
      </div>

      {/* End of results indicator */}
      {!hasNextPage && items.length > 20 && (
        <div className="flex justify-center py-6">
          <span className="text-muted-foreground text-sm">End of results</span>
        </div>
      )}
    </div>
  );
}
