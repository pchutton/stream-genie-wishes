import { useState } from 'react';
import { Plus, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MediaItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_year: number | null;
  genres: string[] | null;
  streaming_platforms: string[] | null;
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

const PLATFORM_COLORS: Record<string, string> = {
  netflix: 'bg-red-600',
  hulu: 'bg-green-500',
  'amazon prime video': 'bg-blue-500',
  'disney+': 'bg-blue-700',
  'apple tv+': 'bg-gray-700',
  hbo: 'bg-purple-700',
  'hbo max': 'bg-purple-700',
  max: 'bg-purple-700',
  peacock: 'bg-yellow-500',
  paramount: 'bg-blue-600',
  'paramount+': 'bg-blue-600',
};

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

  const primaryPlatform = item.streaming_platforms?.[0]?.toLowerCase();

  return (
    <div className="group relative animate-fade-in overflow-hidden rounded-xl bg-card transition-all hover:ring-2 hover:ring-primary/50">
      {/* Poster */}
      <div className="aspect-[2/3] overflow-hidden bg-muted">
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={item.title}
            className={cn(
              'h-full w-full object-cover transition-all duration-300 group-hover:scale-105',
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

        {/* Hover actions */}
        {showActions && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
            {isInWatchlist ? (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={onToggleWatched}
                  title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                >
                  {isWatched ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={onRemoveFromWatchlist}
                  title="Remove from watchlist"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                className="genie-glow"
                onClick={onAddToWatchlist}
                title="Add to watchlist"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">{item.title}</h3>
          {item.release_year && (
            <span className="shrink-0 text-xs text-muted-foreground">{item.release_year}</span>
          )}
        </div>

        {/* Genres */}
        {item.genres && item.genres.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.genres.slice(0, 2).join(' • ')}
          </p>
        )}

        {/* Streaming platforms */}
        {item.streaming_platforms && item.streaming_platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.streaming_platforms.slice(0, 2).map((platform) => (
              <Badge
                key={platform}
                variant="secondary"
                className={cn(
                  'text-[10px] text-white',
                  PLATFORM_COLORS[platform.toLowerCase()] || 'bg-secondary'
                )}
              >
                {platform}
              </Badge>
            ))}
            {item.streaming_platforms.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{item.streaming_platforms.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}