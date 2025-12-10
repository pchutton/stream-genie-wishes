import { Plus, Check, ThumbsUp, ThumbsDown, X, Calendar, Clock, Globe, Trophy, User, Users } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface MediaDetailsDialogProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  userRating?: 'like' | 'dislike' | null;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onToggleWatched?: () => void;
  onRate?: (rating: 'like' | 'dislike' | null) => void;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Calculate blended score from available ratings
function calculateBlendedScore(
  tmdb: number | null | undefined,
  imdb: string | null | undefined,
  rt: string | null | undefined,
  meta: string | null | undefined
): string {
  const scores: number[] = [];
  
  // TMDB is already 0-10
  if (tmdb) scores.push(tmdb);
  
  // IMDb is 0-10
  if (imdb) {
    const parsed = parseFloat(imdb);
    if (!isNaN(parsed)) scores.push(parsed);
  }
  
  // Rotten Tomatoes is percentage, convert to 0-10
  if (rt) {
    const parsed = parseInt(rt.replace('%', ''));
    if (!isNaN(parsed)) scores.push(parsed / 10);
  }
  
  // Metacritic is 0-100, convert to 0-10
  if (meta) {
    const parsed = parseInt(meta);
    if (!isNaN(parsed)) scores.push(parsed / 10);
  }
  
  if (scores.length === 0) return '—';
  
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return average.toFixed(1);
}

export function MediaDetailsDialog({
  item,
  open,
  onOpenChange,
  isInWatchlist = false,
  isWatched = false,
  userRating = null,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-800 p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-full shrink-0 sm:w-72">
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
              <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Check className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>

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
                {item.origin_country && item.origin_country.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {item.origin_country.join(', ')}
                  </span>
                )}
                {item.genres && item.genres.length > 0 && (
                  <span>{item.genres.join(', ')}</span>
                )}
              </div>
            </DialogHeader>

            {/* Blended Score Box */}
            {(item.tmdb_rating || item.imdb_rating || item.rotten_tomatoes || item.metacritic) && (
              <div className="mb-4 rounded-lg border border-zinc-600 bg-zinc-700/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Trophy className="h-4 w-4" />
                  <span>Blended Score</span>
                </div>
                <div className="flex items-center gap-6">
                  {/* Combined Score */}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-400">
                      {calculateBlendedScore(item.tmdb_rating, item.imdb_rating, item.rotten_tomatoes, item.metacritic)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Combined</p>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-12 w-px bg-zinc-600" />
                  
                  {/* Individual Scores */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className={cn("text-lg font-semibold", item.tmdb_rating ? "text-zinc-200" : "text-zinc-400")}>
                        {item.tmdb_rating ?? '—'}
                      </span>
                      <p className="text-xs text-muted-foreground">TMDB</p>
                    </div>
                    <div className="text-center">
                      <span className={cn("text-lg font-semibold", item.imdb_rating ? "text-zinc-200" : "text-zinc-400")}>
                        {item.imdb_rating ?? '—'}
                      </span>
                      <p className="text-xs text-muted-foreground">IMDb</p>
                    </div>
                    <div className="text-center">
                      <span className={cn("text-lg font-semibold", item.rotten_tomatoes ? "text-zinc-200" : "text-zinc-400")}>
                        {item.rotten_tomatoes ?? '—'}
                      </span>
                      <p className="text-xs text-muted-foreground">RT</p>
                    </div>
                    <div className="text-center">
                      <span className={cn("text-lg font-semibold", item.metacritic ? "text-zinc-200" : "text-zinc-400")}>
                        {item.metacritic ?? '—'}
                      </span>
                      <p className="text-xs text-muted-foreground">Meta</p>
                    </div>
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
            {item.cast && item.cast.length > 0 && (
              <div className="mb-4 flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Cast: </span>
                  <span className="text-zinc-200">{item.cast.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Streaming Platforms */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Where to Watch</h4>
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
                  <Plus className="h-4 w-4" /> Add to Watchlist
                </Button>
              )}

              {/* Like Button */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1',
                  userRating === 'like' && 'bg-green-600 border-green-600 hover:bg-green-700'
                )}
                onClick={() => onRate?.(userRating === 'like' ? null : 'like')}
              >
                <ThumbsUp className="h-4 w-4" /> Like
              </Button>

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

              {/* Dislike Button */}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1',
                  userRating === 'dislike' && 'bg-red-600 border-red-600 hover:bg-red-700'
                )}
                onClick={() => onRate?.(userRating === 'dislike' ? null : 'dislike')}
              >
                <ThumbsDown className="h-4 w-4" /> Dislike
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
