import { memo, useState, useCallback, useMemo } from 'react';
import { Plus, Check, X, Calendar, Clock, Globe, Trophy, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { StreamingCarousel } from './StreamingCarousel';
import { MediaItem } from './MediaCard';
import { Badge } from '@/components/ui/badge';

interface MediaDetailsDialogProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onToggleWatched?: () => void;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const MediaDetailsDialog = memo(function MediaDetailsDialog({
  item,
  open,
  onOpenChange,
  isInWatchlist = false,
  isWatched = false,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onToggleWatched,
}: MediaDetailsDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when item changes
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  // Memoized computed values
  const posterUrl = useMemo(() => 
    item?.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
    [item?.poster_path]
  );

  const genresText = useMemo(() => 
    item?.genres?.join(', ') || '',
    [item?.genres]
  );

  const countriesText = useMemo(() => 
    item?.origin_country?.join(', ') || '',
    [item?.origin_country]
  );

  const castText = useMemo(() => 
    item?.cast?.join(', ') || '',
    [item?.cast]
  );

  // Don't render content when closed for performance
  if (!open || !item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-800 p-0 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row pt-6 sm:pt-0">
          {/* Poster with lazy loading - compact on mobile */}
          <div className="relative mx-auto w-32 aspect-[2/3] shrink-0 sm:mx-0 sm:w-72 bg-zinc-900 rounded-lg overflow-hidden">
            {/* Shimmer placeholder */}
            {posterUrl && !imageLoaded && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
            )}
            
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className={cn(
                  'h-full w-full object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={handleImageLoad}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-4xl sm:text-6xl">🎬</span>
              </div>
            )}
            {/* Watched badge */}
            {isWatched && (
              <div className="absolute right-2 top-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Mobile divider */}
          <div className="mx-6 my-4 h-px bg-zinc-600/50 sm:hidden" />

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            {/* Type Badge */}
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </Badge>
            </div>

            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
              
              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                {item.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {item.release_year}
                  </span>
                )}
                {item.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {item.runtime}
                  </span>
                )}
                {countriesText && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {countriesText}
                  </span>
                )}
                {genresText && <span>{genresText}</span>}
              </div>
            </DialogHeader>

            {/* TMDB Rating */}
            {item.tmdb_rating && (
              <div className="mb-4 rounded-lg border border-zinc-600 bg-zinc-700/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Trophy className="h-4 w-4" />
                  <span>Rating</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-400">
                      {item.tmdb_rating.toFixed(1)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">TMDB Score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Overview */}
            {item.overview && (
              <div className="mb-4">
                <p className="text-sm leading-relaxed text-zinc-300">{item.overview}</p>
              </div>
            )}

            {/* Director */}
            {item.director && (
              <div className="mb-2 flex items-start gap-2 text-sm">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">
                    {item.media_type === 'movie' ? 'Director: ' : 'Creator: '}
                  </span>
                  <span className="text-zinc-200">{item.director}</span>
                </div>
              </div>
            )}

            {/* Cast */}
            {castText && (
              <div className="mb-4 flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Cast: </span>
                  <span className="text-zinc-200">{castText}</span>
                </div>
              </div>
            )}

            {/* Streaming Platforms */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Where to Watch</h4>
              <StreamingCarousel
                streaming={item.streaming_platforms}
                rent={item.rent_platforms}
                buy={item.buy_platforms}
              />
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap items-center gap-3">
              {/* Add/Remove from Watchlist */}
              {isInWatchlist ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveFromWatchlist}
                  className="gap-1"
                >
                  <X className="h-4 w-4" /> Remove from List
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="genie-glow gap-1"
                  onClick={onAddToWatchlist}
                >
                  <Plus className="h-4 w-4" /> Add to Watchlist
                </Button>
              )}

              {/* Mark as Seen */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1',
                  isWatched && 'bg-primary border-primary hover:bg-primary/80'
                )}
                onClick={onToggleWatched}
              >
                <Check className="h-4 w-4" /> Mark as Seen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
