import { List, Eye, EyeOff, Trash2, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { MediaCard } from '@/components/media/MediaCard';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useWatchlist, useRemoveFromWatchlist, useToggleWatched } from '@/hooks/useWatchlist';
import { useProfile } from '@/hooks/useProfile';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function WatchlistContent() {
  const { data: watchlist, isLoading } = useWatchlist();
  const { data: profile } = useProfile();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const toggleWatched = useToggleWatched();

  const unwatchedItems = watchlist?.filter(item => !item.is_watched) ?? [];
  const watchedItems = watchlist?.filter(item => item.is_watched) ?? [];

  const watchlistLimit = profile?.subscription_status === 'pro' ? Infinity : 20;
  const isAtLimit = (watchlist?.length ?? 0) >= watchlistLimit && profile?.subscription_status !== 'pro';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <List className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="mb-2 text-xl font-semibold">Your watchlist is empty</h2>
        <p className="mb-6 text-muted-foreground">Start adding movies and shows to build your watchlist</p>
        <Link to="/">
          <Button className="gap-2 genie-glow">
            <Sparkles className="h-4 w-4" />
            Make a Wish
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Watchlist limit warning */}
      {isAtLimit && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-sm">
            You've reached your watchlist limit of 20 items.{' '}
            <Link to="/pro" className="font-medium text-primary hover:underline">
              Upgrade to Pro
            </Link>{' '}
            for unlimited watchlist!
          </p>
        </div>
      )}

      <Tabs defaultValue="to-watch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-watch" className="gap-2">
            <Eye className="h-4 w-4" />
            To Watch ({unwatchedItems.length})
          </TabsTrigger>
          <TabsTrigger value="watched" className="gap-2">
            <EyeOff className="h-4 w-4" />
            Watched ({watchedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="to-watch">
          {unwatchedItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {unwatchedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={{
                    tmdb_id: item.tmdb_id,
                    media_type: item.media_type,
                    title: item.title,
                    poster_path: item.poster_path,
                    release_year: item.release_year,
                    genres: item.genres,
                    streaming_platforms: item.streaming_platforms,
                  }}
                  isInWatchlist={true}
                  isWatched={false}
                  onRemoveFromWatchlist={() => removeFromWatchlist.mutate(item.id)}
                  onToggleWatched={() => toggleWatched.mutate({ id: item.id, is_watched: true })}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">All caught up! Add more titles to your watchlist.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watched">
          {watchedItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={{
                    tmdb_id: item.tmdb_id,
                    media_type: item.media_type,
                    title: item.title,
                    poster_path: item.poster_path,
                    release_year: item.release_year,
                    genres: item.genres,
                    streaming_platforms: item.streaming_platforms,
                  }}
                  isInWatchlist={true}
                  isWatched={true}
                  onRemoveFromWatchlist={() => removeFromWatchlist.mutate(item.id)}
                  onToggleWatched={() => toggleWatched.mutate({ id: item.id, is_watched: false })}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No watched titles yet. Mark titles as watched to see them here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Watchlist() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">My Watchlist</h1>
            <p className="text-muted-foreground">Your saved movies and TV shows</p>
          </div>
          <WatchlistContent />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}