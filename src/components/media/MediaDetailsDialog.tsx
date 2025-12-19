import { useState } from 'react';
import { Plus, Check, X, Calendar, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { StreamingCarousel } from './StreamingCarousel';
import { MediaItem } from './MediaCard';
import { Badge } from '@/components/ui/badge';
import { ReportIssueDialog, ReportIssueButton } from './ReportIssueDialog';
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

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export function MediaDetailsDialog({
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const posterUrl = item?.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null;
  const genresText = item?.genres?.slice(0, 2).join(', ') || '';

  if (!open || !item) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-zinc-800 border-zinc-700">
        {/* Drag handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-zinc-600" />
        
        <div className="overflow-y-auto px-4 pb-6">
          {/* Header row: Poster + Title/Meta */}
          <div className="flex gap-4 pt-4">
            {/* Compact poster */}
            <div className="relative w-24 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-zinc-900">
              {posterUrl && !imageLoaded && (
                <div className="absolute inset-0 bg-zinc-700 animate-pulse" />
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
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <span className="text-3xl">🎬</span>
                </div>
              )}
              {isWatched && (
                <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              <DrawerHeader className="p-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                  </Badge>
                  {item.tmdb_rating && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <Trophy className="h-3 w-3" />
                      {item.tmdb_rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <DrawerTitle className="text-lg font-bold leading-tight line-clamp-2">
                  {item.title}
                </DrawerTitle>
              </DrawerHeader>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                {item.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.release_year}
                  </span>
                )}
                {item.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.runtime}
                  </span>
                )}
              </div>
              {genresText && (
                <p className="text-xs text-muted-foreground mt-1">{genresText}</p>
              )}
            </div>
          </div>

          {/* Overview - truncated */}
          {item.overview && (
            <p className="text-sm text-zinc-300 mt-4 line-clamp-3">{item.overview}</p>
          )}

          {/* Where to Watch */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground">Where to Watch</h4>
              <ReportIssueButton 
                onClick={() => setReportDialogOpen(true)} 
                variant="text"
              />
            </div>
            <StreamingCarousel
              streaming={item.streaming_platforms}
              rent={item.rent_platforms}
              buy={item.buy_platforms}
            />
          </div>

          {/* Report Issue Dialog */}
          <ReportIssueDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            contentType={item.media_type === 'movie' ? 'movie' : 'tv'}
            contentId={String(item.tmdb_id)}
            contentTitle={item.title}
            providers={item.streaming_platforms}
          />

          {/* Action buttons - sticky at bottom feel */}
          <div className="flex gap-2 mt-6">
            {isInWatchlist ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFromWatchlist}
                className="flex-1 h-10 text-xs"
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 h-10 genie-glow text-xs"
                onClick={onAddToWatchlist}
              >
                <Plus className="h-4 w-4 mr-1" /> Add to List
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'flex-1 h-10 text-xs',
                isWatched && 'bg-primary border-primary hover:bg-primary/80'
              )}
              onClick={onToggleWatched}
            >
              <Check className="h-4 w-4 mr-1" /> {isWatched ? 'Watched' : 'Mark Seen'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
