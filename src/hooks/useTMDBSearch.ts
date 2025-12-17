import { useState } from 'react';
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

export function useTMDBSearch() {
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-tmdb', {
        body: { query, region: 'US' },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Sort by release year, newest first
      const sortedResults = (data.results || []).sort((a: TMDBSearchResult, b: TMDBSearchResult) => {
        const yearA = a.release_year || 0;
        const yearB = b.release_year || 0;
        return yearB - yearA;
      });
      setResults(sortedResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search';
      setError(message);
      toast({
        title: 'Search failed',
        description: message,
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
