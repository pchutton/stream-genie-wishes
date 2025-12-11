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

    const GOOGLE_PSE_API_KEY = Deno.env.get('GOOGLE_PSE_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_PSE_CX = '826b8f8b020fa46af'; // Custom Search Engine ID

    if (!GOOGLE_PSE_API_KEY) {
      console.error('GOOGLE_PSE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google PSE not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Search Google PSE for live events
    const searchQuery = `${query} live stream schedule broadcast`;
    console.log('Searching Google PSE for:', searchQuery);

    const googleSearchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleSearchUrl.searchParams.set('key', GOOGLE_PSE_API_KEY);
    googleSearchUrl.searchParams.set('cx', GOOGLE_PSE_CX);
    googleSearchUrl.searchParams.set('q', searchQuery);
    googleSearchUrl.searchParams.set('num', '5');

    const searchResponse = await fetch(googleSearchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google PSE error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Search failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.items || [];

    if (searchResults.length === 0) {
      console.log('No search results found');
      return new Response(
        JSON.stringify({ events: [], message: 'No results found for your search' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${searchResults.length} search results`);

    // Step 2: Use AI to summarize results into structured event data
    const searchContext = searchResults.map((item: any, index: number) => 
      `Result ${index + 1}:\nTitle: ${item.title}\nSnippet: ${item.snippet}\nURL: ${item.link}`
    ).join('\n\n');

    const systemPrompt = `You are a sports and live events assistant. Extract and summarize live event information from search results.

For each distinct event found, provide structured data in JSON format. Return an array of events.

Each event should have:
- eventName: string (the name of the event, game, or match)
- time: string (date/time if available, or "Check source for time" if not found)
- participants: string (teams, fighters, performers involved)
- whereToWatch: string (TV channel, streaming service, or platform)
- link: string (most relevant URL for more info)
- summary: string (brief 1-2 sentence description)

If you cannot find specific information, use reasonable defaults or indicate "Not specified".
Only include events that are clearly identifiable from the search results.
Return ONLY valid JSON array, no other text.`;

    const userPrompt = `User is searching for: "${query}"

Search results:
${searchContext}

Extract live event information and return as a JSON array of event objects.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const aiError = await aiResponse.text();
      console.error('AI error:', aiResponse.status, aiError);
      
      // Fallback: return raw search results if AI fails
      const fallbackEvents = searchResults.map((item: any) => ({
        eventName: item.title,
        time: 'Check source for time',
        participants: 'See details',
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
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';

    console.log('AI response received');

    // Parse AI response
    let events = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
      } else {
        // If no array found, try parsing the whole content
        events = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('AI content was:', aiContent);
      
      // Fallback to raw results
      events = searchResults.map((item: any) => ({
        eventName: item.title,
        time: 'Check source for time',
        participants: 'See details',
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
    console.error('Error in search-live-events:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
