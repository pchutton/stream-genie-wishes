import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Call Lovable AI to summarize and extract event data
    console.log('Calling AI for summarization');
    
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
Extract event details and return a JSON array of events with these fields:
- eventName: Name of the event
- time: When it's happening (date/time)
- participants: Who's playing/performing (teams, fighters, artists)
- whereToWatch: Channel or streaming service to watch
- link: URL for more info
- summary: Brief 1-2 sentence description

Return ONLY a valid JSON array, no markdown or explanation.
If no events found, return an empty array [].`
          },
          {
            role: 'user',
            content: `User searched for: "${query}"\n\nSearch results:\n${searchContext}\n\nExtract live event information as JSON array.`
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
        summary: item.snippet
      }));
      
      return new Response(
        JSON.stringify({ events: fallbackEvents, aiProcessed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    let events = [];
    try {
      // Try to parse the AI response as JSON
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      events = JSON.parse(cleanContent);
      
      if (!Array.isArray(events)) {
        events = [events];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to raw search results
      events = searchResults.slice(0, 4).map((item: any) => ({
        eventName: item.title,
        time: 'Check link for details',
        participants: '',
        whereToWatch: 'See link',
        link: item.link,
        summary: item.snippet
      }));
    }

    console.log(`Returning ${events.length} events`);

    return new Response(
      JSON.stringify({ events, aiProcessed: true }),
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
