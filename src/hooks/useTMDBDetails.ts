import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TMDBDetailedItem {
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  backdrop_path: string | null;
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
  imdb_id: string | null;
  trailer_key: string | null;
  recommendations: {
    tmdb_id: number;
    title: string;
    media_type: string;
    poster_path: string | null;
    release_year: number | null;
  }[];
  tagline: string | null;
  status: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
}

async function fetchDetails(tmdbId: number, mediaType: string): Promise<TMDBDetailedItem> {
  const { data, error } = await supabase.functions.invoke('search-tmdb', {
    body: { 
      tmdb_id: tmdbId, 
      media_type: mediaType, 
      includeDetails: true,
      region: 'US' 
    },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
  
  return data;
}

export function useTMDBDetails(tmdbId: number | null, mediaType: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tmdb-details', tmdbId, mediaType],
    queryFn: () => fetchDetails(tmdbId!, mediaType!),
    enabled: !!tmdbId && !!mediaType,
    staleTime: 1000 * 60 * 30, // 30 min - details change rarely
    gcTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Prefetch function for hover optimization
  const prefetchDetails = (id: number, type: string) => {
    queryClient.prefetchQuery({
      queryKey: ['tmdb-details', id, type],
      queryFn: () => fetchDetails(id, type),
      staleTime: 1000 * 60 * 30,
    });
  };

  return {
    details: query.data,
    isLoading: query.isLoading,
    error: query.error,
    prefetchDetails,
  };
}
