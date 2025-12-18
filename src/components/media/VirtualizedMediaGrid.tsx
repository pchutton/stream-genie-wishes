import React, { useRef, useCallback } from 'react';
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
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export const VirtualizedMediaGrid = React.memo(function VirtualizedMediaGrid({
  items,
  isInWatchlist,
  isWatched,
  onAddToWatchlist,
  onToggleWatched,
  onShowDetails,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualizedMediaGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate columns based on screen width (1 on mobile, 2 on lg+)
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 1;
    return window.innerWidth >= 1024 ? 2 : 1;
  }, []);
  
  const [columnCount, setColumnCount] = React.useState(getColumnCount);
  
  React.useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getColumnCount]);
  
  // Calculate row count based on items and columns
  const rowCount = Math.ceil(items.length / columnCount) + (hasNextPage ? 1 : 0);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Estimated row height
    overscan: 3, // Render 3 extra rows for smoother scrolling
  });
  
  const virtualRows = virtualizer.getVirtualItems();
  
  // Trigger infinite scroll when reaching end
  React.useEffect(() => {
    const lastRow = virtualRows[virtualRows.length - 1];
    if (!lastRow) return;
    
    const isNearEnd = lastRow.index >= rowCount - 2;
    if (isNearEnd && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [virtualRows, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-280px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columnCount;
          const rowItems = items.slice(rowStartIndex, rowStartIndex + columnCount);
          const isLoaderRow = virtualRow.index === rowCount - 1 && hasNextPage;
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow && rowItems.length === 0 ? (
                <div className="flex justify-center items-center h-full py-6">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Scroll for more</span>
                  )}
                </div>
              ) : (
                <div className={`grid gap-4 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {rowItems.map((item) => (
                    <MediaCard
                      key={`${item.media_type}-${item.tmdb_id}`}
                      item={item}
                      isInWatchlist={isInWatchlist(item.tmdb_id, item.media_type)}
                      isWatched={isWatched(item.tmdb_id, item.media_type)}
                      onAddToWatchlist={() => onAddToWatchlist(item)}
                      onToggleWatched={() => onToggleWatched(item)}
                      onShowDetails={() => onShowDetails(item)}
                    />
                  ))}
                </div>
              )}
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
});
