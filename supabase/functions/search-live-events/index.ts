import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiveEvent {
  eventName: string;
  time: string;
  participants: string;
  whereToWatch: string;
  link: string;
  summary: string;
  streamingPlatforms?: string[];
  eventDate?: string; // ISO date for filtering
}

// Helper function to check if an event date is in the past
function isEventInPast(eventTime: string, eventDate?: string): boolean {
  const now = new Date();
  
  // If we have an ISO date, use it directly
  if (eventDate) {
    try {
      const eventDateTime = new Date(eventDate);
      return eventDateTime < now;
    } catch {
      // Fall through to parse eventTime
    }
  }
  
  // Try to parse the time string
  try {
    // Common patterns: "December 19, 2025", "Aug 30, 2025", "November 2, 2025 at 2:30 PM"
    const dateStr = eventTime.replace(/\s+at\s+/i, ' ').replace(/\s+CT|\s+ET|\s+PT|\s+MT/gi, '');
    const eventDateTime = new Date(dateStr);
    
    if (!isNaN(eventDateTime.getTime())) {
      // For dates without specific times, consider them valid until end of that day
      return eventDateTime < now;
    }
  } catch {
    // If we can't parse, include the event (don't filter it out)
  }
  
  return false;
}

// Mapping of broadcast channels to streaming platforms
const channelToStreamingMap: Record<string, string[]> = {
  'ABC': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'DirecTV Stream'],
  'ESPN': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPN2': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPN+': ['ESPN+'],
  'FOX': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'FS1': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'Fox Sports': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'CBS': ['Paramount+', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'NBC': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'Peacock': ['Peacock'],
  'Prime Video': ['Prime Video'],
  'Amazon Prime': ['Prime Video'],
  'TNT': ['Max', 'YouTube TV', 'Hulu + Live TV', 'DirecTV Stream'],
  'TBS': ['Max', 'YouTube TV', 'Hulu + Live TV', 'DirecTV Stream'],
  'NFL Network': ['YouTube TV', 'Fubo', 'Sling Blue', 'DirecTV Stream'],
  'NBA TV': ['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'MLB Network': ['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'USA Network': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
};

async function enrichWithStreamingPlatforms(
  events: LiveEvent[],
  apiKey: string
): Promise<LiveEvent[]> {
  console.log('Enriching events with streaming platforms');
  
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      try {
        const eventDetails = `
Event: ${event.eventName}
Time: ${event.time}
Participants: ${event.participants}
Current broadcast info: ${event.whereToWatch}
`;

        const enrichResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You determine which major US broadcasting networks will show sports events.
Identify the PRIMARY broadcast channel(s) from this list: ABC, ESPN, ESPN2, ESPN+, FOX, FS1, CBS, NBC, Peacock, Prime Video, TNT, TBS, NFL Network, NBA TV, MLB Network, USA Network.
Return ONLY a valid JSON object with broadcast_channels array. No markdown or explanation.`
              },
              {
                role: 'user',
                content: `Based on the following sports event information, identify which major US broadcasting networks will show this event.

EVENT DETAILS:
${eventDetails}

Step 1: Identify the primary broadcast channels (e.g., ABC, ESPN, FOX, CBS, NBC, ESPN+, Peacock, Prime Video, TNT, FS1).

Respond with a JSON object like: {"broadcast_channels": ["ESPN", "ABC"]}
If unknown, return: {"broadcast_channels": []}`
              }
            ],
          }),
        });

        if (!enrichResponse.ok) {
          console.error('Enrichment API error for event:', event.eventName);
          return { ...event, streamingPlatforms: [] };
        }

        const enrichData = await enrichResponse.json();
        const content = enrichData.choices?.[0]?.message?.content || '{}';
        
        try {
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanContent);
          
          const broadcastChannels: string[] = parsed.broadcast_channels || [];
          console.log(`Broadcast channels for ${event.eventName}:`, broadcastChannels);
          
          // Map broadcast channels to all available streaming platforms
          const streamingSet = new Set<string>();
          
          // Add the broadcast channels themselves
          broadcastChannels.forEach(channel => {
            streamingSet.add(channel);
            
            // Add all streaming platforms that carry this channel
            const platforms = channelToStreamingMap[channel];
            if (platforms) {
              platforms.forEach(platform => streamingSet.add(platform));
            }
          });
          
          const streamingPlatforms = Array.from(streamingSet);
          console.log(`All streaming options for ${event.eventName}:`, streamingPlatforms);
          
          return { ...event, streamingPlatforms };
        } catch (parseError) {
          console.error('Failed to parse platforms:', parseError);
        }
        
        return { ...event, streamingPlatforms: [] };
      } catch (error) {
        console.error('Error enriching event:', event.eventName, error);
        return { ...event, streamingPlatforms: [] };
      }
    })
  );

  return enrichedEvents;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PSE_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SEARCH_ENGINE_ID = '826b8f8b020fa46af';

    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_PSE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search with Google PSE
    const searchQuery = `${query} live stream schedule broadcast`;
    console.log(`Searching Google PSE for: ${searchQuery}`);

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.error('Google PSE error:', JSON.stringify(searchData.error));
      return new Response(
        JSON.stringify({ error: 'Search failed', details: JSON.stringify(searchData.error) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchResults = searchData.items || [];
    console.log(`Found ${searchResults.length} search results`);

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({ events: [], aiProcessed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context for AI
    const searchContext = searchResults.map((item: any, i: number) => 
      `[${i + 1}] Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`
    ).join('\n\n');

    // Step 1: Call Lovable AI to extract basic event data
    console.log('Step 1: Calling AI for event extraction');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an assistant that extracts live event information from search results.
Today's date is ${new Date().toISOString().split('T')[0]}.
Extract event details and return a JSON array of events with these fields:
- eventName: Name of the event
- time: When it's happening (date/time as displayed)
- eventDate: The event date in ISO format (YYYY-MM-DD) for filtering - IMPORTANT for determining if event is past
- participants: Who's playing/performing (teams, fighters, artists)
- whereToWatch: Channel or streaming service to watch (from the search results)
- link: URL for more info
- summary: Brief 1-2 sentence description

IMPORTANT: Only include UPCOMING events that have NOT yet occurred. Today is ${new Date().toISOString().split('T')[0]}.
Exclude any events that have already happened.

Return ONLY a valid JSON array, no markdown or explanation.
If no upcoming events found, return an empty array [].`
          },
          {
            role: 'user',
            content: `User searched for: "${query}"\nToday's date: ${new Date().toISOString().split('T')[0]}\n\nSearch results:\n${searchContext}\n\nExtract ONLY UPCOMING live event information as JSON array. Exclude past events.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback: return raw search results
      const fallbackEvents = searchResults.slice(0, 4).map((item: any) => ({
        eventName: item.title,
        time: 'Check link for details',
        participants: '',
        whereToWatch: 'See link',
        link: item.link,
        summary: item.snippet,
        streamingPlatforms: []
      }));
      
      return new Response(
        JSON.stringify({ events: fallbackEvents, aiProcessed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Step 1 complete: Event extraction done');

    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    let events: LiveEvent[] = [];
    try {
      // Try to parse the AI response as JSON
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      events = JSON.parse(cleanContent);
      
      if (!Array.isArray(events)) {
        events = [events];
      }
      
      // Filter out past events as a safety net
      const upcomingEvents = events.filter(event => !isEventInPast(event.time, event.eventDate));
      console.log(`Filtered ${events.length - upcomingEvents.length} past events, ${upcomingEvents.length} upcoming`);
      events = upcomingEvents;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to raw search results
      events = searchResults.slice(0, 4).map((item: any) => ({
        eventName: item.title,
        time: 'Check link for details',
        participants: '',
        whereToWatch: 'See link',
        link: item.link,
        summary: item.snippet,
        streamingPlatforms: []
      }));
    }

    // Step 2: Enrich events with streaming platform information
    console.log('Step 2: Enriching with streaming platforms');
    const enrichedEvents = await enrichWithStreamingPlatforms(events, LOVABLE_API_KEY!);

    console.log(`Returning ${enrichedEvents.length} enriched events`);

    return new Response(
      JSON.stringify({ events: enrichedEvents, aiProcessed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
