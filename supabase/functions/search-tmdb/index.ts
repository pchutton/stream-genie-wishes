import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type: string;
  overview: string;
}

interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TMDBWatchProviders {
  flatrate?: TMDBWatchProvider[];
  free?: TMDBWatchProvider[];
  ads?: TMDBWatchProvider[];
}

// Genre mappings from TMDB
const movieGenres: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const tvGenres: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery',
  10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics', 37: 'Western'
};

async function getWatchProviders(mediaType: string, id: number, region: string = 'US'): Promise<string[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      console.log(`Watch providers request failed for ${mediaType}/${id}`);
      return [];
    }
    
    const data = await response.json();
    const regionData = data.results?.[region] as TMDBWatchProviders | undefined;
    
    if (!regionData) return [];
    
    const providers = new Set<string>();
    
    // Get streaming services (flatrate = subscription services)
    regionData.flatrate?.forEach(p => providers.add(p.provider_name));
    // Also include free and ad-supported options
    regionData.free?.forEach(p => providers.add(p.provider_name));
    regionData.ads?.forEach(p => providers.add(p.provider_name));
    
    return Array.from(providers);
  } catch (error) {
    console.error(`Error fetching watch providers for ${mediaType}/${id}:`, error);
    return [];
  }
}

function getGenreNames(genreIds: number[], mediaType: string): string[] {
  const genreMap = mediaType === 'movie' ? movieGenres : tvGenres;
  return genreIds.map(id => genreMap[id]).filter(Boolean);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region = 'US' } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching TMDB for: "${query}" in region: ${region}`);

    // Search for both movies and TV shows
    const searchResponse = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );

    if (!searchResponse.ok) {
      console.error('TMDB search failed:', searchResponse.status, await searchResponse.text());
      throw new Error('Failed to search TMDB');
    }

    const searchData = await searchResponse.json();
    
    // Filter to only movies and TV shows, limit to 20 results
    const mediaResults = (searchData.results as TMDBSearchResult[])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 20);

    console.log(`Found ${mediaResults.length} results`);

    // Fetch watch providers for each result in parallel
    const resultsWithProviders = await Promise.all(
      mediaResults.map(async (item) => {
        const streamingPlatforms = await getWatchProviders(item.media_type, item.id, region);
        const releaseDate = item.release_date || item.first_air_date;
        
        return {
          tmdb_id: item.id,
          title: item.title || item.name || 'Unknown',
          media_type: item.media_type,
          poster_path: item.poster_path,
          release_year: releaseDate ? parseInt(releaseDate.split('-')[0]) : null,
          genres: getGenreNames(item.genre_ids, item.media_type),
          streaming_platforms: streamingPlatforms,
          overview: item.overview,
        };
      })
    );

    console.log(`Returning ${resultsWithProviders.length} results with streaming info`);

    return new Response(
      JSON.stringify({ results: resultsWithProviders }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in search-tmdb function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
