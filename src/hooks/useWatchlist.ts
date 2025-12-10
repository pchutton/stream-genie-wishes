import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_year: number | null;
  genres: string[] | null;
  streaming_platforms: string[] | null;
  is_watched: boolean;
  added_at: string;
  watched_at: string | null;
}

export function useWatchlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as WatchlistItem[];
    },
    enabled: !!user,
  });
}

export function useAddToWatchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'added_at' | 'watched_at' | 'is_watched'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          ...item,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      toast({ title: 'Added to Watchlist', description: 'Title saved to your watchlist.' });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Already in Watchlist', description: 'This title is already in your watchlist.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add to watchlist.', variant: 'destructive' });
      }
    },
  });
}

export function useRemoveFromWatchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      toast({ title: 'Removed', description: 'Title removed from your watchlist.' });
    },
  });
}

export function useToggleWatched() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_watched }: { id: string; is_watched: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist')
        .update({
          is_watched,
          watched_at: is_watched ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });
}

// Mark as seen - adds to watchlist if not present, then marks as watched
export function useMarkAsSeen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: {
      tmdb_id: number;
      media_type: 'movie' | 'tv';
      title: string;
      poster_path: string | null;
      release_year: number | null;
      genres: string[] | null;
      streaming_platforms: string[] | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Try to find existing entry
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('tmdb_id', item.tmdb_id)
        .eq('media_type', item.media_type)
        .maybeSingle();

      if (existing) {
        // Already in watchlist, mark as watched
        const { data, error } = await supabase
          .from('watchlist')
          .update({
            is_watched: true,
            watched_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Add to watchlist with only the columns that exist in the table
        const { data, error } = await supabase
          .from('watchlist')
          .insert({
            tmdb_id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            release_year: item.release_year,
            genres: item.genres,
            streaming_platforms: item.streaming_platforms,
            user_id: user.id,
            is_watched: true,
            watched_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      toast({ title: 'Marked as Seen', description: 'This title will no longer appear in results.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to mark as seen.', variant: 'destructive' });
    },
  });
}