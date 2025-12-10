import { useState } from 'react';
import { Sparkles, Search as SearchIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SearchBar } from '@/components/search/SearchBar';
import { WishInput } from '@/components/wish/WishInput';
import { MediaCard, MediaItem } from '@/components/media/MediaCard';
import { MediaDetailsDialog } from '@/components/media/MediaDetailsDialog';
import { useAuth } from '@/lib/auth';
import { useAddToWatchlist, useWatchlist, useToggleWatched, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { useIncrementWishUsage } from '@/hooks/useWishUsage';
import { useTMDBSearch } from '@/hooks/useTMDBSearch';
import { useRatings } from '@/hooks/useRatings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user } = useAuth();
  const [wishResults, setWishResults] = useState<MediaItem[]>([]);
  const [isWishing, setIsWishing] = useState(false);
  const [activeTab, setActiveTab] = useState('wish');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { results: searchResults, isLoading: isSearching, search } = useTMDBSearch();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const toggleWatched = useToggleWatched();
  const incrementWishUsage = useIncrementWishUsage();
  const { getRating, setRating } = useRatings();

  const handleShowDetails = (item: MediaItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const getWatchlistItem = (tmdbId: number, mediaType: string) => {
    return watchlist?.find(item => item.tmdb_id === tmdbId && item.media_type === mediaType);
  };

  const handleSearch = async (query: string) => {
    setActiveTab('search');
    await search(query);
  };

  const handleWish = async (mood: string) => {
    setIsWishing(true);
    // TODO: Implement AI wish functionality
    await incrementWishUsage.mutateAsync();
    setTimeout(() => {
      setWishResults([]);
      setIsWishing(false);
    }, 2000);
  };

  const isInWatchlist = (tmdbId: number, mediaType: 'movie' | 'tv') => {
    return watchlist?.some(item => item.tmdb_id === tmdbId && item.media_type === mediaType);
  };

  const isWatched = (tmdbId: number, mediaType: 'movie' | 'tv') => {
    return watchlist?.some(item => item.tmdb_id === tmdbId && item.media_type === mediaType && item.is_watched);
  };

  // Filter out watched titles from results
  const filteredSearchResults = searchResults.filter(item => !isWatched(item.tmdb_id, item.media_type));
  const filteredWishResults = wishResults.filter(item => !isWatched(item.tmdb_id, item.media_type));

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-primary genie-glow">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Your Personal <span className="text-gradient-gold">Streaming Genie</span>
          </h1>
          <p className="mb-8 max-w-lg text-lg text-muted-foreground">
            Tell us what you're in the mood to watch, and we'll find the perfect movie or show for you across all streaming platforms.
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
          <p className="text-muted-foreground">Search for titles or make a wish for personalized recommendations</p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} isLoading={isSearching} className="mb-8" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wish" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Make a Wish
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <SearchIcon className="h-4 w-4" />
              Search Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wish" className="space-y-6">
            <WishInput onSubmit={handleWish} isLoading={isWishing} />

            {filteredWishResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Your Wish Results</h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredWishResults.map((item) => (
                    <MediaCard
                      key={`${item.media_type}-${item.tmdb_id}`}
                      item={item}
                      isInWatchlist={isInWatchlist(item.tmdb_id, item.media_type)}
                      rating={getRating(item.tmdb_id, item.media_type)}
                      onAddToWatchlist={() => addToWatchlist.mutate(item)}
                      onRate={(rating) => setRating(item.tmdb_id, item.media_type, rating)}
                      onShowDetails={() => handleShowDetails(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {isWishing && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 h-16 w-16 animate-pulse-glow rounded-2xl bg-primary p-4">
                  <Sparkles className="h-full w-full text-primary-foreground" />
                </div>
                <p className="text-muted-foreground">The Genie is working on your wish...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            {filteredSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredSearchResults.map((item) => (
                  <MediaCard
                    key={`${item.media_type}-${item.tmdb_id}`}
                    item={item}
                    isInWatchlist={isInWatchlist(item.tmdb_id, item.media_type)}
                    rating={getRating(item.tmdb_id, item.media_type)}
                    onAddToWatchlist={() => addToWatchlist.mutate(item)}
                    onRate={(rating) => setRating(item.tmdb_id, item.media_type, rating)}
                    onShowDetails={() => handleShowDetails(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <SearchIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {isSearching ? 'Searching...' : 'Search for movies or TV shows to see results here'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        {/* Details Dialog */}
        <MediaDetailsDialog
          item={selectedItem}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          isInWatchlist={selectedItem ? isInWatchlist(selectedItem.tmdb_id, selectedItem.media_type) : false}
          isWatched={selectedItem ? getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type)?.is_watched ?? false : false}
          userRating={selectedItem ? getRating(selectedItem.tmdb_id, selectedItem.media_type) : null}
          onAddToWatchlist={() => selectedItem && addToWatchlist.mutate(selectedItem)}
          onRemoveFromWatchlist={() => {
            const wlItem = selectedItem && getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type);
            if (wlItem) removeFromWatchlist.mutate(wlItem.id);
          }}
          onToggleWatched={() => {
            const wlItem = selectedItem && getWatchlistItem(selectedItem.tmdb_id, selectedItem.media_type);
            if (wlItem) toggleWatched.mutate({ id: wlItem.id, is_watched: !wlItem.is_watched });
          }}
          onRate={(rating) => selectedItem && setRating(selectedItem.tmdb_id, selectedItem.media_type, rating)}
        />
      </div>
    </Layout>
  );
}