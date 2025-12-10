import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const OMDB_API_KEY = Deno.env.get('OMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

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
  vote_average?: number;
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
  rent?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
}

interface WatchProviderResult {
  streaming: string[];
  rent: string[];
  buy: string[];
}

interface CastMember {
  name: string;
  character: string;
}

interface CrewMember {
  name: string;
  job: string;
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

async function getWatchProviders(mediaType: string, id: number, region: string = 'US'): Promise<WatchProviderResult> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      console.log(`Watch providers request failed for ${mediaType}/${id}`);
      return { streaming: [], rent: [], buy: [] };
    }
    
    const data = await response.json();
    const regionData = data.results?.[region] as TMDBWatchProviders | undefined;
    
    if (!regionData) return { streaming: [], rent: [], buy: [] };
    
    const streaming = new Set<string>();
    const rent = new Set<string>();
    const buy = new Set<string>();
    
    // Get streaming services (flatrate = subscription services)
    regionData.flatrate?.forEach(p => streaming.add(p.provider_name));
    // Also include free and ad-supported options as streaming
    regionData.free?.forEach(p => streaming.add(p.provider_name));
    regionData.ads?.forEach(p => streaming.add(p.provider_name));
    
    // Get rental options
    regionData.rent?.forEach(p => rent.add(p.provider_name));
    
    // Get purchase options
    regionData.buy?.forEach(p => buy.add(p.provider_name));
    
    return {
      streaming: Array.from(streaming),
      rent: Array.from(rent),
      buy: Array.from(buy),
    };
  } catch (error) {
    console.error(`Error fetching watch providers for ${mediaType}/${id}:`, error);
    return { streaming: [], rent: [], buy: [] };
  }
}

interface OMDBRatings {
  imdb_rating: string | null;
  rotten_tomatoes: string | null;
  metacritic: string | null;
}

async function getOMDBRatings(imdbId: string | null): Promise<OMDBRatings> {
  if (!imdbId || !OMDB_API_KEY) {
    return { imdb_rating: null, rotten_tomatoes: null, metacritic: null };
  }

  try {
    const response = await fetch(`${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}`);
    if (!response.ok) {
      return { imdb_rating: null, rotten_tomatoes: null, metacritic: null };
    }

    const data = await response.json();
    if (data.Response === 'False') {
      return { imdb_rating: null, rotten_tomatoes: null, metacritic: null };
    }

    let rotten_tomatoes: string | null = null;
    if (data.Ratings) {
      const rtRating = data.Ratings.find((r: { Source: string; Value: string }) => 
        r.Source === 'Rotten Tomatoes'
      );
      if (rtRating) {
        rotten_tomatoes = rtRating.Value;
      }
    }

    return {
      imdb_rating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      rotten_tomatoes,
      metacritic: data.Metascore !== 'N/A' ? data.Metascore : null,
    };
  } catch (error) {
    console.error(`Error fetching OMDB ratings for ${imdbId}:`, error);
    return { imdb_rating: null, rotten_tomatoes: null, metacritic: null };
  }
}

async function getDetails(mediaType: string, id: number): Promise<{
  runtime: number | null;
  director: string | null;
  cast: string[];
  vote_average: number | null;
  origin_country: string[];
  imdb_id: string | null;
}> {
  try {
    // Fetch details, credits, and external IDs in parallel
    const [detailsRes, creditsRes, externalIdsRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/external_ids?api_key=${TMDB_API_KEY}`)
    ]);

    const details = detailsRes.ok ? await detailsRes.json() : null;
    const credits = creditsRes.ok ? await creditsRes.json() : null;
    const externalIds = externalIdsRes.ok ? await externalIdsRes.json() : null;

    // Get runtime (movies have runtime, TV shows have episode_run_time array)
    let runtime: number | null = null;
    if (mediaType === 'movie' && details?.runtime) {
      runtime = details.runtime;
    } else if (mediaType === 'tv' && details?.episode_run_time?.length > 0) {
      runtime = details.episode_run_time[0];
    }

    // Get director (movies) or creator (TV shows)
    let director: string | null = null;
    if (mediaType === 'movie' && credits?.crew) {
      const directorData = (credits.crew as CrewMember[]).find(c => c.job === 'Director');
      director = directorData?.name || null;
    } else if (mediaType === 'tv' && details?.created_by?.length > 0) {
      director = details.created_by[0]?.name || null;
    }

    // Get top 5 cast members
    const cast: string[] = credits?.cast
      ? (credits.cast as CastMember[]).slice(0, 5).map(c => c.name)
      : [];

    // Get origin country
    const origin_country: string[] = details?.origin_country || 
      (details?.production_countries?.map((c: { iso_3166_1: string }) => c.iso_3166_1) || []);

    return {
      runtime,
      director,
      cast,
      vote_average: details?.vote_average || null,
      origin_country: origin_country.slice(0, 2),
      imdb_id: externalIds?.imdb_id || null,
    };
  } catch (error) {
    console.error(`Error fetching details for ${mediaType}/${id}:`, error);
    return { runtime: null, director: null, cast: [], vote_average: null, origin_country: [], imdb_id: null };
  }
}

function getGenreNames(genreIds: number[], mediaType: string): string[] {
  const genreMap = mediaType === 'movie' ? movieGenres : tvGenres;
  return genreIds.map(id => genreMap[id]).filter(Boolean);
}

function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
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

    // Fetch watch providers, details, and OMDB ratings for each result in parallel
    const resultsWithProviders = await Promise.all(
      mediaResults.map(async (item) => {
        const [watchProviders, details] = await Promise.all([
          getWatchProviders(item.media_type, item.id, region),
          getDetails(item.media_type, item.id)
        ]);
        
        // Fetch OMDB ratings if we have an IMDB ID
        const omdbRatings = await getOMDBRatings(details.imdb_id);
        
        const releaseDate = item.release_date || item.first_air_date;
        
        return {
          tmdb_id: item.id,
          title: item.title || item.name || 'Unknown',
          media_type: item.media_type,
          poster_path: item.poster_path,
          release_year: releaseDate ? parseInt(releaseDate.split('-')[0]) : null,
          genres: getGenreNames(item.genre_ids, item.media_type),
          streaming_platforms: watchProviders.streaming,
          rent_platforms: watchProviders.rent,
          buy_platforms: watchProviders.buy,
          overview: item.overview,
          runtime: formatRuntime(details.runtime),
          director: details.director,
          cast: details.cast,
          tmdb_rating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
          imdb_rating: omdbRatings.imdb_rating,
          rotten_tomatoes: omdbRatings.rotten_tomatoes,
          metacritic: omdbRatings.metacritic,
          origin_country: details.origin_country,
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
