import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryAnalysis {
  normalizedQuery: string;
  isFranchise: boolean;
  franchiseName: string | null;
}

async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not configured, skipping query analysis');
    return { normalizedQuery: query, isFranchise: false, franchiseName: null };
  }

  try {
    console.log(`Analyzing query: "${query}"`);
    
    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Analyze the user's movie/TV search query and determine:
1. The corrected/normalized search text
2. Whether this is a franchise search (Star Wars, Marvel, Harry Potter, Lord of the Rings, Jurassic Park, Fast & Furious, James Bond, Mission Impossible, Indiana Jones, Batman, Spider-Man, X-Men, Transformers, Pirates of the Caribbean, The Matrix, Terminator, Rocky, Rambo, Die Hard, Alien, Predator, Back to the Future, Toy Story, Shrek, Ice Age, Madagascar, Kung Fu Panda, How to Train Your Dragon, Despicable Me, The Hunger Games, Twilight, Divergent, The Maze Runner, etc.)

Rules:
- Add missing spaces for combined words (starwars → Star Wars)
- Correct common typos
- Use official spellings`
          },
          {
            role: 'user',
            content: query
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_search_query',
              description: 'Analyze and normalize the search query',
              parameters: {
                type: 'object',
                properties: {
                  normalizedQuery: {
                    type: 'string',
                    description: 'The corrected/normalized search query'
                  },
                  isFranchise: {
                    type: 'boolean',
                    description: 'True if this is a well-known movie franchise search'
                  },
                  franchiseName: {
                    type: 'string',
                    description: 'The official franchise name for collection search (e.g., "Star Wars Collection", "Harry Potter Collection")'
                  }
                },
                required: ['normalizedQuery', 'isFranchise'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_search_query' } },
      }),
    });

    if (!response.ok) {
      console.log(`AI analysis failed: ${response.status}`);
      return { normalizedQuery: query, isFranchise: false, franchiseName: null };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`Query analysis result:`, args);
      return {
        normalizedQuery: args.normalizedQuery || query,
        isFranchise: args.isFranchise || false,
        franchiseName: args.franchiseName || null
      };
    }
    
    return { normalizedQuery: query, isFranchise: false, franchiseName: null };
  } catch (error) {
    console.error('Error analyzing query:', error);
    return { normalizedQuery: query, isFranchise: false, franchiseName: null };
  }
}

interface TMDBCollectionMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  genre_ids?: number[];
  vote_average?: number;
}

async function searchCollection(franchiseName: string): Promise<TMDBCollectionMovie[]> {
  try {
    const searchRes = await fetch(
      `${TMDB_BASE_URL}/search/collection?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(franchiseName)}&language=en-US`
    );
    
    if (!searchRes.ok) {
      console.log(`Collection search failed: ${searchRes.status}`);
      return [];
    }
    
    const searchData = await searchRes.json();
    const collection = searchData.results?.[0];
    
    if (!collection) {
      console.log(`No collection found for: ${franchiseName}`);
      return [];
    }
    
    console.log(`Found collection: ${collection.name} (ID: ${collection.id})`);
    
    const collectionRes = await fetch(
      `${TMDB_BASE_URL}/collection/${collection.id}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!collectionRes.ok) {
      console.log(`Collection details failed: ${collectionRes.status}`);
      return [];
    }
    
    const collectionData = await collectionRes.json();
    const movies = collectionData.parts || [];
    
    console.log(`Found ${movies.length} movies in collection`);
    
    return movies.sort((a: TMDBCollectionMovie, b: TMDBCollectionMovie) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error searching collection:', error);
    return [];
  }
}

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

// Combined function using append_to_response to reduce API calls (3 → 1 per item!)
async function getMediaDetails(mediaType: string, id: number, region: string = 'US'): Promise<{
  runtime: number | null;
  director: string | null;
  cast: string[];
  vote_average: number | null;
  origin_country: string[];
  streaming: string[];
  rent: string[];
  buy: string[];
}> {
  try {
    // Single API call with append_to_response
    const response = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,watch/providers`
    );
    
    if (!response.ok) {
      console.log(`Details request failed for ${mediaType}/${id}: ${response.status}`);
      return { runtime: null, director: null, cast: [], vote_average: null, origin_country: [], streaming: [], rent: [], buy: [] };
    }
    
    const data = await response.json();
    
    // Extract runtime
    let runtime: number | null = null;
    if (mediaType === 'movie' && data.runtime) {
      runtime = data.runtime;
    } else if (mediaType === 'tv' && data.episode_run_time?.length > 0) {
      runtime = data.episode_run_time[0];
    }

    // Extract director/creator
    let director: string | null = null;
    if (mediaType === 'movie' && data.credits?.crew) {
      const directorData = (data.credits.crew as CrewMember[]).find(c => c.job === 'Director');
      director = directorData?.name || null;
    } else if (mediaType === 'tv' && data.created_by?.length > 0) {
      director = data.created_by[0]?.name || null;
    }

    // Extract cast
    const cast: string[] = data.credits?.cast
      ? (data.credits.cast as CastMember[]).slice(0, 5).map(c => c.name)
      : [];

    // Extract origin country
    const origin_country: string[] = data.origin_country || 
      (data.production_countries?.map((c: { iso_3166_1: string }) => c.iso_3166_1) || []);

    // Extract watch providers for region
    const regionData = data['watch/providers']?.results?.[region] as TMDBWatchProviders | undefined;
    
    const streaming = new Set<string>();
    const rent = new Set<string>();
    const buy = new Set<string>();
    
    if (regionData) {
      regionData.flatrate?.forEach(p => streaming.add(p.provider_name));
      regionData.free?.forEach(p => streaming.add(p.provider_name));
      regionData.ads?.forEach(p => streaming.add(p.provider_name));
      regionData.rent?.forEach(p => rent.add(p.provider_name));
      regionData.buy?.forEach(p => buy.add(p.provider_name));
    }

    return {
      runtime,
      director,
      cast,
      vote_average: data.vote_average || null,
      origin_country: origin_country.slice(0, 2),
      streaming: Array.from(streaming),
      rent: Array.from(rent),
      buy: Array.from(buy),
    };
  } catch (error) {
    console.error(`Error fetching details for ${mediaType}/${id}:`, error);
    return { runtime: null, director: null, cast: [], vote_average: null, origin_country: [], streaming: [], rent: [], buy: [] };
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

    console.log(`Original query: "${query}" in region: ${region}`);

    const { normalizedQuery, isFranchise, franchiseName } = await analyzeQuery(query);
    
    console.log(`Query analysis - normalized: "${normalizedQuery}", isFranchise: ${isFranchise}, franchiseName: ${franchiseName}`);

    let mediaResults: TMDBSearchResult[] = [];

    if (isFranchise && franchiseName) {
      const collectionMovies = await searchCollection(franchiseName);
      
      if (collectionMovies.length > 0) {
        mediaResults = collectionMovies.map(movie => ({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids || [],
          media_type: 'movie',
          overview: movie.overview,
          vote_average: movie.vote_average,
        }));
        console.log(`Using ${mediaResults.length} movies from collection`);
      }
    }

    if (mediaResults.length === 0) {
      console.log(`Searching TMDB multi for: "${normalizedQuery}"`);
      
      const [page1Response, page2Response] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(normalizedQuery)}&language=en-US&include_adult=false&page=1`),
        fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(normalizedQuery)}&language=en-US&include_adult=false&page=2`)
      ]);

      if (!page1Response.ok) {
        console.error('TMDB search failed:', page1Response.status, await page1Response.text());
        throw new Error('Failed to search TMDB');
      }

      const page1Data = await page1Response.json();
      const page2Data = page2Response.ok ? await page2Response.json() : { results: [] };
      
      const allResults = [...(page1Data.results || []), ...(page2Data.results || [])];
      
      mediaResults = (allResults as TMDBSearchResult[])
        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        .slice(0, 25);
        
      console.log(`TMDB returned ${page1Data.results?.length || 0} + ${page2Data.results?.length || 0} results, filtered to ${mediaResults.length}`);
    }

    console.log(`Found ${mediaResults.length} results`);

    const resultsWithProviders = await Promise.all(
      mediaResults.map(async (item) => {
        // Single optimized call per item (was 3 calls before)
        const details = await getMediaDetails(item.media_type, item.id, region);
        
        const releaseDate = item.release_date || item.first_air_date;
        
        return {
          tmdb_id: item.id,
          title: item.title || item.name || 'Unknown',
          media_type: item.media_type,
          poster_path: item.poster_path,
          release_year: releaseDate ? parseInt(releaseDate.split('-')[0]) : null,
          genres: getGenreNames(item.genre_ids, item.media_type),
          streaming_platforms: details.streaming,
          rent_platforms: details.rent,
          buy_platforms: details.buy,
          overview: item.overview,
          runtime: formatRuntime(details.runtime),
          director: details.director,
          cast: details.cast,
          tmdb_rating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
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
