import { useState } from 'react';
import { Plus, Check, Eye, EyeOff, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StreamingCarousel } from './StreamingCarousel';

export interface MediaItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_year: number | null;
  genres: string[] | null;
  streaming_platforms: string[] | null;
  rent_platforms?: string[] | null;
  buy_platforms?: string[] | null;
  overview?: string;
  runtime?: string | null;
  director?: string | null;
  cast?: string[];
  tmdb_rating?: number | null;
  origin_country?: string[];
}

interface MediaCardProps {
  item: MediaItem;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onToggleWatched?: () => void;
  onShowDetails?: () => void;
  showActions?: boolean;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export function MediaCard({
  item,
  isInWatchlist = false,
  isWatched = false,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onToggleWatched,
  onShowDetails,
  showActions = true,
}: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = item.poster_path 
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : null;

  // Prefetch higher-res poster on hover for instant details dialog load
  const handlePrefetch = () => {
    if (item.poster_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails?.();
  };

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatched?.();
  };

  return (
    <div 
      className="group relative animate-fade-in flex gap-4 overflow-hidden rounded-xl bg-zinc-700 p-4 transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:shadow-[0_0_25px_hsl(var(--genie-gold)/0.3),0_0_50px_hsl(var(--genie-gold)/0.1)] hover:-translate-y-1 active:scale-[0.98] touch-manipulation"
      onMouseEnter={handlePrefetch}
    >
      {/* Poster with group hover */}
      <div className="group relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900 cursor-pointer">
        {/* Shimmer placeholder while loading */}
        {posterUrl && !imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )}
        
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={cn(
              'h-full w-full object-contain transition-all duration-300 pointer-events-none group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
        )}

        {/* Hover Overlay - uses @media (hover: hover) automatically */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
          {/* Details Button */}
          <Button
            size="sm"
            className="w-full genie-glow text-xs"
            onClick={handleDetailsClick}
          >
            <Play className="mr-1 h-3 w-3" /> Details
          </Button>
          
          {/* Mark as watched */}
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'w-full h-7 text-xs bg-zinc-800/80 hover:bg-zinc-700',
              isWatched && 'bg-primary/80 hover:bg-primary/60'
            )}
            onClick={handleWatchedClick}
          >
            <Eye className="mr-1 h-3 w-3" />
            {isWatched ? 'Watched' : 'Mark Seen'}
          </Button>
        </div>

        {/* Watched overlay (when not hovering) */}
        {isWatched && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 group-hover:opacity-0 transition-opacity duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-base font-semibold leading-tight line-clamp-2">{item.title}</h3>
        
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {item.release_year && <span>{item.release_year}</span>}
          {item.genres && item.genres.length > 0 && (
            <>
              <span>•</span>
              <span>{item.genres.slice(0, 2).join(', ')}</span>
            </>
          )}
          <span>•</span>
          <span className="capitalize">{item.media_type === 'movie' ? 'Movie' : 'TV Show'}</span>
        </div>

        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">Available on:</p>
          <StreamingCarousel 
            streaming={item.streaming_platforms} 
            rent={item.rent_platforms}
            buy={item.buy_platforms}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-auto flex gap-2 pt-3">
            {isInWatchlist ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onToggleWatched}
                  className={cn(
                    "h-8 text-xs transition-all duration-300 active:scale-95",
                    !isWatched && "bg-emerald-600 hover:bg-emerald-700 text-white animate-scale-in shadow-[0_0_12px_rgba(16,185,129,0.5)] hover:shadow-[0_0_18px_rgba(16,185,129,0.7)]"
                  )}
                >
                  {isWatched ? <EyeOff className="mr-1 h-3 w-3" /> : <Check className="mr-1 h-3 w-3 animate-scale-in" />}
                  {isWatched ? 'Unwatch' : 'Added'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRemoveFromWatchlist}
                  className="h-8 text-xs"
                >
                  Remove
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="genie-glow h-8 text-xs"
                onClick={onAddToWatchlist}
              >
                <Plus className="mr-1 h-3 w-3" /> Add to List
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
