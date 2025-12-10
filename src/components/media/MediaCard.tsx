import { useState } from 'react';
import { Plus, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StreamingIcons } from './StreamingIcons';

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
}

interface MediaCardProps {
  item: MediaItem;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onToggleWatched?: () => void;
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
  showActions = true,
}: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = item.poster_path 
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : null;

  return (
    <div className="group relative animate-fade-in flex flex-col overflow-hidden rounded-xl bg-card transition-all hover:ring-2 hover:ring-primary/50">
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={item.title}
            className={cn(
              'h-full w-full object-cover transition-all duration-300',
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

        {/* Watched overlay */}
        {isWatched && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Check className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Streaming Icons overlay - bottom right */}
        <div className="absolute bottom-2 right-2">
          <StreamingIcons 
            platforms={item.streaming_platforms} 
            rentPlatforms={item.rent_platforms}
            buyPlatforms={item.buy_platforms}
            size="sm" 
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{item.title}</h3>
          
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
            {item.release_year && (
              <span className="text-xs text-muted-foreground">{item.release_year}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-3 flex gap-2">
            {isInWatchlist ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onToggleWatched}
                  className="h-8 flex-1 text-xs"
                >
                  {isWatched ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                  {isWatched ? 'Unwatch' : 'Watched'}
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
                className="genie-glow h-8 w-full text-xs"
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
