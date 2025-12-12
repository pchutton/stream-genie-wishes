import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformInfo {
  name: string;
  status: string; // "Included", "Included with provider login", "Rent: $X.XX", etc.
}

interface LiveEvent {
  eventName: string;
  time: string;
  participants: string;
  whereToWatch: string;
  link: string;
  summary: string;
  streamingPlatforms?: string[];
  platformDetails?: PlatformInfo[];
  eventDate?: string; // ISO date for filtering
}

// Helper function to fetch ESPN schedule page and extract game time
async function fetchESPNGameTime(teamName: string, eventDate?: string): Promise<string | null> {
  try {
    // Map team names to ESPN team slugs and sport types
    const espnTeamMap: Record<string, { slug: string; sport: string; league: string }> = {
      // College Football
      'Oklahoma Sooners': { slug: 'oklahoma-sooners', sport: 'college-football', league: 'team' },
      'Alabama Crimson Tide': { slug: 'alabama-crimson-tide', sport: 'college-football', league: 'team' },
      'Georgia Bulldogs': { slug: 'georgia-bulldogs', sport: 'college-football', league: 'team' },
      'Ohio State Buckeyes': { slug: 'ohio-state-buckeyes', sport: 'college-football', league: 'team' },
      'Michigan Wolverines': { slug: 'michigan-wolverines', sport: 'college-football', league: 'team' },
      'Texas Longhorns': { slug: 'texas-longhorns', sport: 'college-football', league: 'team' },
      'Notre Dame Fighting Irish': { slug: 'notre-dame-fighting-irish', sport: 'college-football', league: 'team' },
      'Clemson Tigers': { slug: 'clemson-tigers', sport: 'college-football', league: 'team' },
      'Oregon Ducks': { slug: 'oregon-ducks', sport: 'college-football', league: 'team' },
      'Penn State Nittany Lions': { slug: 'penn-state-nittany-lions', sport: 'college-football', league: 'team' },
      'Florida State Seminoles': { slug: 'florida-state-seminoles', sport: 'college-football', league: 'team' },
      'Tennessee Volunteers': { slug: 'tennessee-volunteers', sport: 'college-football', league: 'team' },
      'Florida Gators': { slug: 'florida-gators', sport: 'college-football', league: 'team' },
      'USC Trojans': { slug: 'usc-trojans', sport: 'college-football', league: 'team' },
      'Texas A&M Aggies': { slug: 'texas-am-aggies', sport: 'college-football', league: 'team' },
      
      // NFL Teams
      'Dallas Cowboys': { slug: 'dal', sport: 'nfl', league: 'team' },
      'Kansas City Chiefs': { slug: 'kc', sport: 'nfl', league: 'team' },
      'San Francisco 49ers': { slug: 'sf', sport: 'nfl', league: 'team' },
      'Philadelphia Eagles': { slug: 'phi', sport: 'nfl', league: 'team' },
      'Buffalo Bills': { slug: 'buf', sport: 'nfl', league: 'team' },
      'Miami Dolphins': { slug: 'mia', sport: 'nfl', league: 'team' },
      'New England Patriots': { slug: 'ne', sport: 'nfl', league: 'team' },
      'New York Jets': { slug: 'nyj', sport: 'nfl', league: 'team' },
      'New York Giants': { slug: 'nyg', sport: 'nfl', league: 'team' },
      'Baltimore Ravens': { slug: 'bal', sport: 'nfl', league: 'team' },
      'Pittsburgh Steelers': { slug: 'pit', sport: 'nfl', league: 'team' },
      'Cleveland Browns': { slug: 'cle', sport: 'nfl', league: 'team' },
      'Cincinnati Bengals': { slug: 'cin', sport: 'nfl', league: 'team' },
      'Denver Broncos': { slug: 'den', sport: 'nfl', league: 'team' },
      'Las Vegas Raiders': { slug: 'lv', sport: 'nfl', league: 'team' },
      'Los Angeles Chargers': { slug: 'lac', sport: 'nfl', league: 'team' },
      'Green Bay Packers': { slug: 'gb', sport: 'nfl', league: 'team' },
      'Chicago Bears': { slug: 'chi', sport: 'nfl', league: 'team' },
      'Detroit Lions': { slug: 'det', sport: 'nfl', league: 'team' },
      'Minnesota Vikings': { slug: 'min', sport: 'nfl', league: 'team' },
      'Tampa Bay Buccaneers': { slug: 'tb', sport: 'nfl', league: 'team' },
      'Atlanta Falcons': { slug: 'atl', sport: 'nfl', league: 'team' },
      'New Orleans Saints': { slug: 'no', sport: 'nfl', league: 'team' },
      'Carolina Panthers': { slug: 'car', sport: 'nfl', league: 'team' },
      'Seattle Seahawks': { slug: 'sea', sport: 'nfl', league: 'team' },
      'Los Angeles Rams': { slug: 'lar', sport: 'nfl', league: 'team' },
      'Arizona Cardinals': { slug: 'ari', sport: 'nfl', league: 'team' },
      'Washington Commanders': { slug: 'wsh', sport: 'nfl', league: 'team' },
      'Houston Texans': { slug: 'hou', sport: 'nfl', league: 'team' },
      'Indianapolis Colts': { slug: 'ind', sport: 'nfl', league: 'team' },
      'Tennessee Titans': { slug: 'ten', sport: 'nfl', league: 'team' },
      'Jacksonville Jaguars': { slug: 'jax', sport: 'nfl', league: 'team' },
      
      // NBA Teams
      'Los Angeles Lakers': { slug: 'lal', sport: 'nba', league: 'team' },
      'Golden State Warriors': { slug: 'gs', sport: 'nba', league: 'team' },
      'Boston Celtics': { slug: 'bos', sport: 'nba', league: 'team' },
      'Milwaukee Bucks': { slug: 'mil', sport: 'nba', league: 'team' },
      'Phoenix Suns': { slug: 'phx', sport: 'nba', league: 'team' },
      'Dallas Mavericks': { slug: 'dal', sport: 'nba', league: 'team' },
      'Miami Heat': { slug: 'mia', sport: 'nba', league: 'team' },
      'Denver Nuggets': { slug: 'den', sport: 'nba', league: 'team' },
    };

    // Find the team in our map
    let teamInfo = espnTeamMap[teamName];
    
    // Try to find a partial match if exact match fails
    if (!teamInfo) {
      for (const [key, value] of Object.entries(espnTeamMap)) {
        if (teamName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
          teamInfo = value;
          break;
        }
      }
    }
    
    if (!teamInfo) {
      console.log(`No ESPN mapping found for team: ${teamName}`);
      return null;
    }

    // Construct ESPN API URL for team schedule
    const espnApiUrl = teamInfo.sport === 'college-football' 
      ? `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamInfo.slug}/schedule`
      : `https://site.api.espn.com/apis/site/v2/sports/${teamInfo.sport.includes('nfl') ? 'football/nfl' : teamInfo.sport.includes('nba') ? 'basketball/nba' : teamInfo.sport}/teams/${teamInfo.slug}/schedule`;

    console.log(`Fetching ESPN schedule: ${espnApiUrl}`);
    
    const response = await fetch(espnApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`ESPN API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const events = data.events || [];
    
    // Find the event matching our date
    for (const event of events) {
      const eventDateStr = event.date;
      if (!eventDateStr) continue;
      
      const eventDateTime = new Date(eventDateStr);
      const targetDate = eventDate ? new Date(eventDate) : new Date();
      
      // Check if dates match (same day)
      if (eventDateTime.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]) {
        // Format the time nicely
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        };
        const formattedTime = eventDateTime.toLocaleString('en-US', { ...options, timeZone: 'America/New_York' });
        console.log(`Found ESPN game time: ${formattedTime}`);
        return formattedTime;
      }
    }
    
    // If no exact date match, find the next upcoming game
    const now = new Date();
    for (const event of events) {
      const eventDateTime = new Date(event.date);
      if (eventDateTime > now) {
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        };
        const formattedTime = eventDateTime.toLocaleString('en-US', { ...options, timeZone: 'America/New_York' });
        console.log(`Found next ESPN game time: ${formattedTime}`);
        return formattedTime;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching ESPN schedule:', error);
    return null;
  }
}

// Helper function to extract team name from event for ESPN lookup
function extractTeamFromEvent(event: LiveEvent): string | null {
  // Try to extract from participants first
  const participants = event.participants || '';
  const parts = participants.split(/\s+vs\.?\s+|\s+@\s+/i);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  // Try to extract from event name
  const eventName = event.eventName || '';
  const vsMatch = eventName.match(/(.+?)\s+vs\.?\s+/i);
  if (vsMatch) {
    return vsMatch[1].trim();
  }
  
  return null;
}

// Helper function to check if an event date is in the past
function isEventInPast(eventTime: string, eventDate?: string): boolean {
  const now = new Date();
  // Get today's date at midnight for comparison (be lenient - include all events today)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`Checking if event is past - eventTime: "${eventTime}", eventDate: "${eventDate}", now: ${now.toISOString()}`);
  
  // If we have an ISO date, use it directly
  if (eventDate) {
    try {
      const eventDateTime = new Date(eventDate);
      // Only filter if the event date is BEFORE today (not today itself)
      const isPast = eventDateTime < todayStart;
      console.log(`  Parsed eventDate: ${eventDateTime.toISOString()}, isPast: ${isPast}`);
      return isPast;
    } catch {
      console.log(`  Failed to parse eventDate`);
      // Fall through to parse eventTime
    }
  }
  
  // Try to parse the time string
  try {
    // Common patterns: "December 19, 2025", "Aug 30, 2025", "November 2, 2025 at 2:30 PM"
    const dateStr = eventTime.replace(/\s+at\s+/i, ' ').replace(/\s+CT|\s+ET|\s+PT|\s+MT/gi, '');
    const eventDateTime = new Date(dateStr);
    
    if (!isNaN(eventDateTime.getTime())) {
      // Only filter if the event date is BEFORE today
      const isPast = eventDateTime < todayStart;
      console.log(`  Parsed eventTime: ${eventDateTime.toISOString()}, isPast: ${isPast}`);
      return isPast;
    }
  } catch {
    // If we can't parse, include the event (don't filter it out)
    console.log(`  Could not parse eventTime`);
  }
  
  // When in doubt, include the event
  console.log(`  Unable to determine date, including event`);
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

        // Step 2a: Get broadcast channels
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
          return { ...event, streamingPlatforms: [], platformDetails: [] };
        }

        const enrichData = await enrichResponse.json();
        const content = enrichData.choices?.[0]?.message?.content || '{}';
        
        let streamingPlatforms: string[] = [];
        let broadcastChannels: string[] = [];
        
        try {
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanContent);
          
          broadcastChannels = parsed.broadcast_channels || [];
          console.log(`Broadcast channels for ${event.eventName}:`, broadcastChannels);
          
          // Map broadcast channels to all available streaming platforms
          const streamingSet = new Set<string>();
          
          broadcastChannels.forEach(channel => {
            streamingSet.add(channel);
            const platforms = channelToStreamingMap[channel];
            if (platforms) {
              platforms.forEach(platform => streamingSet.add(platform));
            }
          });
          
          streamingPlatforms = Array.from(streamingSet);
          console.log(`All streaming options for ${event.eventName}:`, streamingPlatforms);
        } catch (parseError) {
          console.error('Failed to parse platforms:', parseError);
          return { ...event, streamingPlatforms: [], platformDetails: [] };
        }

        // Step 2b: Get pricing/availability status for each platform
        if (streamingPlatforms.length > 0) {
          const pricingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: `You determine pricing and availability status for streaming platforms showing sports events.

Rules:
- Live TV services (Hulu + Live TV, YouTube TV, Fubo, DirecTV Stream, Sling Orange, Sling Blue): "Included"
- ESPN App, ABC app, Fox Sports app, NBC Sports app: "Included with provider login"
- Dedicated streaming services (ESPN+, Peacock, Paramount+, Max, Prime Video): "Included with [service] subscription"
- Broadcast networks shown directly (ABC, CBS, NBC, FOX, ESPN, FS1, TNT, TBS, NFL Network, NBA TV, MLB Network): "Live broadcast" 
- If rental/PPV is needed (rare for live sports): "Rent: $X.XX" or "PPV: $X.XX"

Return ONLY valid JSON, no markdown.`
                },
                {
                  role: 'user',
                  content: `Based on the broadcast channels and streaming platforms below, determine the status for each platform.

EVENT: ${event.eventName}
BROADCAST CHANNELS: ${broadcastChannels.join(', ')}
PLATFORMS: ${streamingPlatforms.join(', ')}

Return JSON like:
{"platforms": [{"name": "Hulu + Live TV", "status": "Included"}, {"name": "ESPN App", "status": "Included with provider login"}]}`
                }
              ],
            }),
          });

          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            const pricingContent = pricingData.choices?.[0]?.message?.content || '{}';
            
            try {
              const cleanPricing = pricingContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const pricingParsed = JSON.parse(cleanPricing);
              const platformDetails: PlatformInfo[] = pricingParsed.platforms || [];
              
              console.log(`Platform details for ${event.eventName}:`, platformDetails);
              return { ...event, streamingPlatforms, platformDetails };
            } catch (pricingParseError) {
              console.error('Failed to parse pricing:', pricingParseError);
              // Fallback: generate default statuses
              const defaultDetails = streamingPlatforms.map(name => ({
                name,
                status: getDefaultStatus(name)
              }));
              return { ...event, streamingPlatforms, platformDetails: defaultDetails };
            }
          }
        }
        
        return { ...event, streamingPlatforms, platformDetails: [] };
      } catch (error) {
        console.error('Error enriching event:', event.eventName, error);
        return { ...event, streamingPlatforms: [], platformDetails: [] };
      }
    })
  );

  return enrichedEvents;
}

// Default status fallback based on platform type
function getDefaultStatus(platform: string): string {
  const liveTVServices = ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'DirecTV Stream', 'Sling Orange', 'Sling Blue'];
  const providerLoginApps = ['ESPN App', 'ABC', 'FOX', 'CBS', 'NBC', 'FS1', 'Fox Sports'];
  const subscriptionServices: Record<string, string> = {
    'ESPN+': 'Included with ESPN+ subscription',
    'Peacock': 'Included with Peacock subscription',
    'Paramount+': 'Included with Paramount+ subscription',
    'Max': 'Included with Max subscription',
    'Prime Video': 'Included with Prime Video subscription',
  };
  const broadcasts = ['ESPN', 'ESPN2', 'TNT', 'TBS', 'NFL Network', 'NBA TV', 'MLB Network', 'USA Network'];
  
  if (liveTVServices.includes(platform)) return 'Included';
  if (providerLoginApps.includes(platform)) return 'Included with provider login';
  if (subscriptionServices[platform]) return subscriptionServices[platform];
  if (broadcasts.includes(platform)) return 'Live broadcast';
  return 'Check platform for details';
}

// Team nickname dictionary for pre-processing queries
const teamNicknames: Record<string, string> = {
  // NFL Teams
  "niners": "San Francisco 49ers", "49ers": "San Francisco 49ers",
  "cowboys": "Dallas Cowboys", "chiefs": "Kansas City Chiefs",
  "pats": "New England Patriots", "patriots": "New England Patriots",
  "fins": "Miami Dolphins", "dolphins": "Miami Dolphins",
  "jets": "New York Jets", "giants": "New York Giants",
  "saints": "New Orleans Saints", "packers": "Green Bay Packers",
  "steelers": "Pittsburgh Steelers", "broncos": "Denver Broncos",
  "bears": "Chicago Bears", "lions": "Detroit Lions",
  "ravens": "Baltimore Ravens", "bucs": "Tampa Bay Buccaneers",
  "buccaneers": "Tampa Bay Buccaneers", "rams": "Los Angeles Rams",
  "chargers": "Los Angeles Chargers", "vikings": "Minnesota Vikings",
  "bills": "Buffalo Bills", "texans": "Houston Texans",
  "jags": "Jacksonville Jaguars", "jaguars": "Jacksonville Jaguars",
  "raiders": "Las Vegas Raiders", "commanders": "Washington Commanders",
  "eagles": "Philadelphia Eagles", "panthers": "Carolina Panthers",
  "falcons": "Atlanta Falcons", "titans": "Tennessee Titans",
  "colts": "Indianapolis Colts", "cardinals": "Arizona Cardinals",
  "seahawks": "Seattle Seahawks", "bengals": "Cincinnati Bengals",
  "browns": "Cleveland Browns",
  
  // NBA Teams
  "dubs": "Golden State Warriors", "warriors": "Golden State Warriors",
  "lakers": "Los Angeles Lakers", "clips": "Los Angeles Clippers",
  "clippers": "Los Angeles Clippers", "suns": "Phoenix Suns",
  "mavs": "Dallas Mavericks", "bucks": "Milwaukee Bucks",
  "celtics": "Boston Celtics", "knicks": "New York Knicks",
  "nets": "Brooklyn Nets", "raps": "Toronto Raptors",
  "raptors": "Toronto Raptors", "heat": "Miami Heat",
  "magic": "Orlando Magic", "hawks": "Atlanta Hawks",
  "pels": "New Orleans Pelicans", "pelicans": "New Orleans Pelicans",
  "spurs": "San Antonio Spurs", "grizz": "Memphis Grizzlies",
  "grizzlies": "Memphis Grizzlies", "blazers": "Portland Trail Blazers",
  "nuggets": "Denver Nuggets", "rockets": "Houston Rockets",
  "wolves": "Minnesota Timberwolves", "jazz": "Utah Jazz",
  "kings": "Sacramento Kings", "wizards": "Washington Wizards",
  "bulls": "Chicago Bulls",
  
  // MLB Teams
  "yanks": "New York Yankees", "yankees": "New York Yankees",
  "mets": "New York Mets", "bo-sox": "Boston Red Sox",
  "red sox": "Boston Red Sox", "sox": "Chicago White Sox",
  "white sox": "Chicago White Sox", "cubs": "Chicago Cubs",
  "cards": "St. Louis Cardinals", "dodgers": "Los Angeles Dodgers",
  "braves": "Atlanta Braves", "phillies": "Philadelphia Phillies",
  "orioles": "Baltimore Orioles", "rangers": "Texas Rangers",
  "mariners": "Seattle Mariners", "astros": "Houston Astros",
  "tigers": "Detroit Tigers", "royals": "Kansas City Royals",
  "pirates": "Pittsburgh Pirates", "rays": "Tampa Bay Rays",
  "twins": "Minnesota Twins",
  
  // NHL Teams
  "bruins": "Boston Bruins", "isles": "New York Islanders",
  "islanders": "New York Islanders", "devils": "New Jersey Devils",
  "pens": "Pittsburgh Penguins", "penguins": "Pittsburgh Penguins",
  "caps": "Washington Capitals", "capitals": "Washington Capitals",
  "flyers": "Philadelphia Flyers", "leafs": "Toronto Maple Leafs",
  "lightning": "Tampa Bay Lightning", "blackhawks": "Chicago Blackhawks",
  "canes": "Carolina Hurricanes", "hurricanes": "Carolina Hurricanes",
  "avs": "Colorado Avalanche", "avalanche": "Colorado Avalanche",
  "knights": "Vegas Golden Knights", "golden knights": "Vegas Golden Knights",
  "kraken": "Seattle Kraken", "sabres": "Buffalo Sabres",
  
  // College Football
  "bama": "Alabama Crimson Tide", "roll tide": "Alabama Crimson Tide",
  "ou": "Oklahoma Sooners", "sooners": "Oklahoma Sooners",
  "osu": "Oklahoma State Cowboys", "longhorns": "Texas Longhorns",
  "horns": "Texas Longhorns", "gators": "Florida Gators",
  "vols": "Tennessee Volunteers", "volunteers": "Tennessee Volunteers",
  "bulldogs": "Georgia Bulldogs", "fsu": "Florida State Seminoles",
  "seminoles": "Florida State Seminoles", "trojans": "USC Trojans",
  "fighting irish": "Notre Dame Fighting Irish", "clemson": "Clemson Tigers",
  "wolverines": "Michigan Wolverines", "buckeyes": "Ohio State Buckeyes",
  "penn state": "Penn State Nittany Lions", "oregon": "Oregon Ducks",
  "ducks": "Oregon Ducks", "badgers": "Wisconsin Badgers",
  "huskers": "Nebraska Cornhuskers", "aggies": "Texas A&M Aggies",
  "wildcats": "Kentucky Wildcats",
  
  // College Basketball
  "jayhawks": "Kansas Jayhawks", "tar heels": "North Carolina Tar Heels",
  "dukies": "Duke Blue Devils", "blue devils": "Duke Blue Devils",
  "huskies": "UConn Huskies", "spartans": "Michigan State Spartans",
  "kansas": "Kansas Jayhawks", "villanova": "Villanova Wildcats",
};

// Convert dictionary to string for AI prompt
function getDictionaryString(): string {
  const categories: Record<string, string[]> = {
    'NFL': [], 'NBA': [], 'MLB': [], 'NHL': [], 'College Football': [], 'College Basketball': []
  };
  
  // Group by category based on team name patterns
  for (const [nickname, fullName] of Object.entries(teamNicknames)) {
    if (fullName.includes('49ers') || fullName.includes('Cowboys') || fullName.includes('Chiefs') || 
        fullName.includes('Patriots') || fullName.includes('Dolphins') || fullName.includes('Jets') ||
        fullName.includes('Giants') || fullName.includes('Saints') || fullName.includes('Packers') ||
        fullName.includes('Steelers') || fullName.includes('Broncos') || fullName.includes('Bears') ||
        fullName.includes('Lions') || fullName.includes('Ravens') || fullName.includes('Buccaneers') ||
        fullName.includes('Rams') || fullName.includes('Chargers') || fullName.includes('Vikings') ||
        fullName.includes('Bills') || fullName.includes('Texans') || fullName.includes('Jaguars') ||
        fullName.includes('Raiders') || fullName.includes('Commanders') || fullName.includes('Eagles') ||
        fullName.includes('Panthers') || fullName.includes('Falcons') || fullName.includes('Titans') ||
        fullName.includes('Colts') || fullName.includes('Cardinals') || fullName.includes('Seahawks') ||
        fullName.includes('Bengals') || fullName.includes('Browns')) {
      categories['NFL'].push(`"${nickname}" → "${fullName}"`);
    } else if (fullName.includes('Warriors') || fullName.includes('Lakers') || fullName.includes('Clippers') ||
               fullName.includes('Suns') || fullName.includes('Mavericks') || fullName.includes('Bucks') ||
               fullName.includes('Celtics') || fullName.includes('Knicks') || fullName.includes('Nets') ||
               fullName.includes('Raptors') || fullName.includes('Heat') || fullName.includes('Magic') ||
               fullName.includes('Hawks') || fullName.includes('Pelicans') || fullName.includes('Spurs') ||
               fullName.includes('Grizzlies') || fullName.includes('Trail Blazers') || fullName.includes('Nuggets') ||
               fullName.includes('Rockets') || fullName.includes('Timberwolves') || fullName.includes('Jazz') ||
               fullName.includes('Kings') || fullName.includes('Wizards') || fullName.includes('Bulls')) {
      categories['NBA'].push(`"${nickname}" → "${fullName}"`);
    }
  }
  
  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([cat, items]) => `${cat}: ${items.slice(0, 10).join(', ')}...`)
    .join('\n');
}

// Pre-process query with dictionary lookup before AI normalization
function preProcessQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check for exact matches first
  if (teamNicknames[lowerQuery]) {
    return teamNicknames[lowerQuery];
  }
  
  // Check if any nickname is contained in the query and replace it
  let processedQuery = query;
  for (const [nickname, fullName] of Object.entries(teamNicknames)) {
    const regex = new RegExp(`\\b${nickname}\\b`, 'gi');
    if (regex.test(processedQuery)) {
      processedQuery = processedQuery.replace(regex, fullName);
      break; // Only replace first match to avoid conflicts
    }
  }
  
  return processedQuery;
}

// AI query normalization to expand partial team names
async function normalizeQuery(query: string, apiKey: string): Promise<string> {
  console.log('Original query:', query);
  
  // Pre-process with dictionary first
  const preProcessed = preProcessQuery(query);
  console.log('Pre-processed query:', preProcessed);
  
  // If pre-processing already expanded the query significantly, we may skip AI
  // But still run AI to add context like "schedule" or "next game"
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You rewrite sports search queries into fully qualified sports search phrases.

TEAM NICKNAME DICTIONARY (partial list):
NFL: "niners" → "San Francisco 49ers", "cowboys" → "Dallas Cowboys", "chiefs" → "Kansas City Chiefs", "pats" → "New England Patriots"...
NBA: "dubs" → "Golden State Warriors", "lakers" → "Los Angeles Lakers", "warriors" → "Golden State Warriors", "celtics" → "Boston Celtics"...
MLB: "yanks" → "New York Yankees", "dodgers" → "Los Angeles Dodgers", "sox" → "Chicago White Sox"...
NHL: "bruins" → "Boston Bruins", "pens" → "Pittsburgh Penguins", "caps" → "Washington Capitals"...
College: "bama" → "Alabama Crimson Tide", "sooners" → "Oklahoma Sooners", "buckeyes" → "Ohio State Buckeyes"...

RULES:
1. If any nickname or partial team name is detected, REPLACE it with the full official team name
2. Add sports context: "schedule", "next game", "upcoming match", or "broadcast information"
3. Ensure the query is optimized for retrieving live event schedules and broadcast info

EXAMPLES:
"nuggets" → "Denver Nuggets basketball next game schedule"
"lakers game" → "Los Angeles Lakers basketball game schedule"  
"warriors tonight" → "Golden State Warriors basketball game tonight broadcast"
"bama football" → "Alabama Crimson Tide football schedule"
"chiefs vs raiders" → "Kansas City Chiefs vs Las Vegas Raiders NFL game schedule"
"UFC this weekend" → "UFC next event schedule broadcast"

Return ONLY the rewritten query text. Do NOT explain.`
          },
          {
            role: 'user',
            content: preProcessed
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Query normalization failed, using pre-processed query');
      return preProcessed;
    }

    const data = await response.json();
    const normalizedQuery = data.choices?.[0]?.message?.content?.trim() || preProcessed;
    console.log('Normalized query:', normalizedQuery);
    return normalizedQuery;
  } catch (error) {
    console.error('Query normalization error:', error);
    return preProcessed;
  }
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

    // Step 0: Normalize query using AI
    const normalizedQuery = await normalizeQuery(query, LOVABLE_API_KEY!);
    
    // Search with Google PSE using normalized query
    const searchQuery = `${normalizedQuery} live stream schedule broadcast`;
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
- time: MUST include the full date AND specific time of day (e.g., "Saturday, Dec 21 at 8:00 PM ET" or "Sun, 12/22 - 4:25 PM EST"). If no specific time is mentioned, use "TBD" for the time portion but still include the date.
- eventDate: The event date in ISO format (YYYY-MM-DD) for filtering - IMPORTANT for determining if event is past
- participants: Who's playing/performing (teams, fighters, artists)
- whereToWatch: Channel or streaming service to watch (from the search results)
- link: URL for more info
- summary: Brief 1-2 sentence description

CRITICAL: The "time" field MUST be as specific as possible. Include:
1. Day of week (if available)
2. Date (month/day)
3. Time of day with timezone (e.g., "8:00 PM ET", "3:30 PM CST")
If the exact kickoff/start time isn't in the search results, indicate "Time TBD" but still provide the date.

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

    // Step 1.5: Enhance game times with ESPN API for events with TBD time
    console.log('Step 1.5: Enhancing game times with ESPN API');
    const eventsWithTimes = await Promise.all(
      events.map(async (event) => {
        // Check if time contains TBD or is missing specific time
        const timeStr = event.time?.toLowerCase() || '';
        if (timeStr.includes('tbd') || !timeStr.match(/\d{1,2}:\d{2}/)) {
          const teamName = extractTeamFromEvent(event);
          if (teamName) {
            console.log(`Looking up ESPN time for team: ${teamName}, date: ${event.eventDate}`);
            const espnTime = await fetchESPNGameTime(teamName, event.eventDate);
            if (espnTime) {
              console.log(`Updated time from "${event.time}" to "${espnTime}"`);
              return { ...event, time: espnTime };
            }
          }
        }
        return event;
      })
    );

    // Step 2: Enrich events with streaming platform information
    console.log('Step 2: Enriching with streaming platforms');
    const enrichedEvents = await enrichWithStreamingPlatforms(eventsWithTimes, LOVABLE_API_KEY!);

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
