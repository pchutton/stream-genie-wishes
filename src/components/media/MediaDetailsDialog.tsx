import { Plus, Check, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { StreamingBadges } from './StreamingBadges';
import { MediaItem } from './MediaCard';

interface MediaDetailsDialogProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  rating?: 'like' | 'dislike' | null;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onToggleWatched?: () => void;
  onRate?: (rating: 'like' | 'dislike' | null) => void;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function MediaDetailsDialog({
  item,
  open,
  onOpenChange,
  isInWatchlist = false,
  isWatched = false,
  rating = null,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onToggleWatched,
  onRate,
}: MediaDetailsDialogProps) {
  if (!item) return null;

  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden bg-zinc-800 p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-full shrink-0 sm:w-64">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-6xl">🎬</span>
              </div>
            )}
            {/* Watched badge */}
            {isWatched && (
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold">{item.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {item.release_year && <span>{item.release_year}</span>}
                {item.genres && item.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{item.genres.join(', ')}</span>
                  </>
                )}
                <span>•</span>
                <span className="capitalize">
                  {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                </span>
              </div>
            </DialogHeader>

            {/* Overview */}
            {item.overview && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Overview</h4>
                <p className="text-sm leading-relaxed">{item.overview}</p>
              </div>
            )}

            {/* Streaming Platforms */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Available on</h4>
              <StreamingBadges
                platforms={item.streaming_platforms}
                rentPlatforms={item.rent_platforms}
                buyPlatforms={item.buy_platforms}
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
                  <Plus className="h-4 w-4" /> Add to List
                </Button>
              )}

              {/* Watched Toggle */}
              <Button
                variant={isWatched ? 'secondary' : 'outline'}
                size="sm"
                onClick={onToggleWatched}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                {isWatched ? 'Watched' : 'Mark Watched'}
              </Button>

              {/* Rating Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'h-9 w-9 rounded-full',
                    rating === 'like'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  )}
                  onClick={() => onRate?.(rating === 'like' ? null : 'like')}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'h-9 w-9 rounded-full',
                    rating === 'dislike'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  )}
                  onClick={() => onRate?.(rating === 'dislike' ? null : 'dislike')}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
