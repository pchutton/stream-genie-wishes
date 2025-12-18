import { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
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

interface SearchResponse {
  results: TMDBSearchResult[];
  page: number;
  totalPages: number;
  hasMore: boolean;
}

async function searchTMDB(query: string, page: number): Promise<SearchResponse> {
  if (!query.trim()) return { results: [], page: 1, totalPages: 1, hasMore: false };

  const { data, error } = await supabase.functions.invoke('search-tmdb', {
    body: { query, region: 'US', page },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);

  // Sort by release year, newest first
  const sortedResults = (data.results || []).sort((a: TMDBSearchResult, b: TMDBSearchResult) => {
    const yearA = a.release_year || 0;
    const yearB = b.release_year || 0;
    return yearB - yearA;
  });

  return {
    results: sortedResults,
    page: data.page || 1,
    totalPages: data.totalPages || 1,
    hasMore: data.hasMore || false,
  };
}

export function useTMDBSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tmdb-search', searchQuery],
    queryFn: ({ pageParam = 1 }) => searchTMDB(searchQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });

  // Flatten all pages into single results array
  const results = data?.pages.flatMap(page => page.results) ?? [];

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
      queryClient.prefetchInfiniteQuery({
        queryKey: ['tmdb-search', query],
        queryFn: ({ pageParam = 1 }) => searchTMDB(query, pageParam),
        initialPageParam: 1,
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
