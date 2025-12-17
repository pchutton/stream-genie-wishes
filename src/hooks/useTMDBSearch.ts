import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TMDBSearchResult {
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_year: number | null;
  genres: string[];
  streaming_platforms: string[];
  rent_platforms: string[];
  buy_platforms: string[];
  overview: string;
  runtime: string | null;
  director: string | null;
  cast: string[];
  tmdb_rating: number | null;
  origin_country: string[];
}

async function searchTMDB(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase.functions.invoke('search-tmdb', {
    body: { query, region: 'US' },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);

  // Sort by release year, newest first
  return (data.results || []).sort((a: TMDBSearchResult, b: TMDBSearchResult) => {
    const yearA = a.release_year || 0;
    const yearB = b.release_year || 0;
    return yearB - yearA;
  });
}

export function useTMDBSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['tmdb-search', searchQuery],
    queryFn: () => searchTMDB(searchQuery),
    enabled: searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 1,
  });

  // Show error toast in effect, not during render
  useEffect(() => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Failed to search';
      toast({
        title: 'Search failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearResults = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Prefetch function for hover optimization
  const prefetchSearch = useCallback((query: string) => {
    if (query.trim()) {
      queryClient.prefetchQuery({
        queryKey: ['tmdb-search', query],
        queryFn: () => searchTMDB(query),
        staleTime: 1000 * 60 * 10,
      });
    }
  }, [queryClient]);

  return {
    results,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to search') : null,
    search,
    clearResults,
    prefetchSearch,
  };
}
