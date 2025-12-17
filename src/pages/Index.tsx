import { useState } from 'react';
import { Sparkles, Search as SearchIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SearchBar, SearchMode } from '@/components/search/SearchBar';
import { MediaCard, MediaItem } from '@/components/media/MediaCard';
import { MediaDetailsDialog } from '@/components/media/MediaDetailsDialog';
import { LiveEventsSearch } from '@/components/search/LiveEventsSearch';
import { useAuth } from '@/lib/auth';
import { useAddToWatchlist, useWatchlist, useToggleWatched, useRemoveFromWatchlist, useMarkAsSeen } from '@/hooks/useWatchlist';
import { useTMDBSearch } from '@/hooks/useTMDBSearch';
import { useLiveEventsSearch } from '@/hooks/useLiveEventsSearch';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('media');

  const { results: searchResults, isLoading: isSearching, search, clearResults: clearMediaResults } = useTMDBSearch();
  const { results: liveResults, isLoading: isSearchingLive, search: searchLive, clearResults: clearLiveResults } = useLiveEventsSearch();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const toggleWatched = useToggleWatched();
  const markAsSeen = useMarkAsSeen();
  

  const handleShowDetails = (item: MediaItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const getWatchlistItem = (tmdbId: number, mediaType: string) => {
    return watchlist?.find(item => item.tmdb_id === tmdbId && item.media_type === mediaType);
  };

  const handleSearch = async (query: string, mode: SearchMode) => {
    setSearchMode(mode);
    if (mode === 'media') {
      clearLiveResults();
      await search(query);
    } else {
      clearMediaResults();
      await searchLive(query);
    }
  };

  const isInWatchlist = (tmdbId: number, mediaType: 'movie' | 'tv') => {
    return watchlist?.some(item => item.tmdb_id === tmdbId && item.media_type === mediaType);
  };

  const isWatched = (tmdbId: number, mediaType: 'movie' | 'tv') => {
    return watchlist?.some(item => item.tmdb_id === tmdbId && item.media_type === mediaType && item.is_watched);
  };

  // No longer filtering out watched titles - users can see all results

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-primary genie-glow">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Your Personal <span className="text-gradient-gold">Streaming Guide</span>
          </h1>
          <p className="mb-8 max-w-lg text-lg text-muted-foreground">
            Find the perfect movie or show across all streaming platforms.
          </p>
          <div className="flex gap-4">
            <Link to="/signup">
              <Button size="lg" className="genie-glow">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">What do you want to watch?</h1>
          <p className="text-muted-foreground">Search for movies, TV shows, or live events</p>
        </div>

        {/* Sticky Search Bar Container */}
        <div className="sticky top-0 z-40 -mx-4 bg-background/95 backdrop-blur-sm px-4 py-3 mb-4">
          <SearchBar onSearch={handleSearch} isLoading={isSearching || isSearchingLive} />
        </div>


        {/* Search Results */}
        <div className="space-y-4">
          {searchMode === 'live' ? (
            <LiveEventsSearch results={liveResults} isLoading={isSearchingLive} />
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {searchResults.map((item) => (
                <MediaCard
                  key={`${item.media_type}-${item.tmdb_id}`}
                  item={item}
                  isInWatchlist={isInWatchlist(item.tmdb_id, item.media_type)}
                  isWatched={isWatched(item.tmdb_id, item.media_type)}
                  onAddToWatchlist={() => addToWatchlist.mutate(item)}
                  onToggleWatched={() => {
                    const wlItem = getWatchlistItem(item.tmdb_id, item.media_type);
                    if (wlItem) {
                      toggleWatched.mutate({ id: wlItem.id, is_watched: !wlItem.is_watched });
                    } else {
                      markAsSeen.mutate(item);
                    }
                  }}
                  onShowDetails={() => handleShowDetails(item)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SearchIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {isSearching ? 'Searching...' : (
                  <>
                    Try{' '}
                    <Link to="/expanded-search" className="text-primary hover:underline font-medium">
                      Expanded Search
                    </Link>
                    {' '}for concerts, international leagues, or any live event.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Details Dialog */}
        <MediaDetailsDialog
          item={selectedItem}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          isInWatchlist={selectedItem ? isInWatchlist(selectedItem.tmdb_id, selectedItem.media_type) : false}
          isWatched={selectedItem ? getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type)?.is_watched ?? false : false}
          onAddToWatchlist={() => selectedItem && addToWatchlist.mutate(selectedItem)}
          onRemoveFromWatchlist={() => {
            const wlItem = selectedItem && getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type);
            if (wlItem) removeFromWatchlist.mutate(wlItem.id);
          }}
          onToggleWatched={() => {
            if (!selectedItem) return;
            const wlItem = getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type);
            if (wlItem) {
              toggleWatched.mutate({ id: wlItem.id, is_watched: !wlItem.is_watched });
            } else {
              markAsSeen.mutate(selectedItem);
            }
          }}
        />
      </div>
    </Layout>
  );
}
