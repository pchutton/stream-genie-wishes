import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ CACHING LAYER ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache (persists during function warm period)
const espnCache = new Map<string, CacheEntry<any>>();

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  SCHEDULE: 10 * 60 * 1000,      // 10 minutes for schedule data
  SCOREBOARD: 2 * 60 * 1000,     // 2 minutes for live scoreboard
  TEAM_SEARCH: 30 * 60 * 1000,   // 30 minutes for team search results
};

function getCached<T>(key: string): T | null {
  const entry = espnCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    espnCache.delete(key);
    console.log(`Cache expired for key: ${key}`);
    return null;
  }
  
  console.log(`Cache hit for key: ${key}`);
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  espnCache.set(key, { data, timestamp: Date.now(), ttl });
  console.log(`Cache set for key: ${key} (TTL: ${ttl / 1000}s)`);
  
  // Cleanup old entries if cache gets too large (prevent memory bloat)
  if (espnCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of espnCache.entries()) {
      if (now - v.timestamp > v.ttl) {
        espnCache.delete(k);
      }
    }
  }
}

// Cached fetch wrapper for ESPN API
async function cachedFetch(url: string, ttl: number): Promise<any | null> {
  const cacheKey = `espn:${url}`;
  
  // Check cache first
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  
  // Fetch from ESPN
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) {
      console.log(`ESPN API returned ${response.status} for: ${url}`);
      return null;
    }
    
    const data = await response.json();
    setCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error(`ESPN fetch error for ${url}:`, error);
    return null;
  }
}

// ============ INTERFACES ============
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
  eventDateTimeUTC?: string; // Full ISO timestamp for frontend timezone conversion
}

interface ESPNGameInfo {
  time: string;
  opponent: string;
  eventName: string;
  eventDate?: string;
  eventDateTimeUTC?: string; // Full ISO timestamp
}

// ============ TIMEZONE HELPERS ============
// Deno Edge Functions don't support toLocaleString timeZone properly, so we manually convert

function isInDaylightSavingTime(date: Date): boolean {
  // US DST: Second Sunday of March to First Sunday of November
  const year = date.getUTCFullYear();
  
  // Second Sunday of March (DST starts at 2:00 AM local)
  const marchFirst = new Date(Date.UTC(year, 2, 1)); // March 1
  const dstStart = new Date(Date.UTC(year, 2, (14 - marchFirst.getUTCDay()) % 7 + 8, 8)); // 2AM CST = 8AM UTC
  
  // First Sunday of November (DST ends at 2:00 AM local)
  const novFirst = new Date(Date.UTC(year, 10, 1)); // November 1
  const dstEnd = new Date(Date.UTC(year, 10, (7 - novFirst.getUTCDay()) % 7 + 1, 7)); // 2AM CDT = 7AM UTC
  
  return date >= dstStart && date < dstEnd;
}

function formatTimeInCentral(utcDate: Date, includeDateOnly: boolean = false): string {
  // Determine if date is in CDT (-5) or CST (-6)
  const isDST = isInDaylightSavingTime(utcDate);
  const offsetHours = isDST ? -5 : -6;
  
  // Create adjusted date by applying offset
  const centralTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[centralTime.getUTCDay()];
  const monthName = months[centralTime.getUTCMonth()];
  const dayNum = centralTime.getUTCDate();
  
  if (includeDateOnly) {
    return `${dayName}, ${monthName} ${dayNum}`;
  }
  
  let hours = centralTime.getUTCHours();
  const minutes = centralTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  const minuteStr = minutes.toString().padStart(2, '0');
  const tzSuffix = isDST ? 'CDT' : 'CST';
  
  console.log(`Timezone conversion: UTC ${utcDate.toISOString()} -> Central ${dayName}, ${monthName} ${dayNum}, ${hours}:${minuteStr} ${ampm} ${tzSuffix} (offset: ${offsetHours}h, DST: ${isDST})`);
  
  return `${dayName}, ${monthName} ${dayNum}, ${hours}:${minuteStr} ${ampm} ${tzSuffix}`;
}

// Helper function to fetch multiple upcoming games from ESPN for a team
// Returns up to `limit` upcoming games
async function fetchMultipleESPNGames(teamName: string, limit: number = 5, sportHint?: string): Promise<ESPNGameInfo[]> {
  const games: ESPNGameInfo[] = [];
  
  try {
    // Map team names to ESPN team slugs and sport types
    const espnTeamMap: Record<string, { slug: string; sport: string; league: string }> = {
      // NBA Teams
      'Los Angeles Lakers': { slug: 'lal', sport: 'nba', league: 'team' },
      'Golden State Warriors': { slug: 'gs', sport: 'nba', league: 'team' },
      'Boston Celtics': { slug: 'bos', sport: 'nba', league: 'team' },
      'Milwaukee Bucks': { slug: 'mil', sport: 'nba', league: 'team' },
      'Phoenix Suns': { slug: 'phx', sport: 'nba', league: 'team' },
      'Dallas Mavericks': { slug: 'dal', sport: 'nba', league: 'team' },
      'Miami Heat': { slug: 'mia', sport: 'nba', league: 'team' },
      'Denver Nuggets': { slug: 'den', sport: 'nba', league: 'team' },
      'Brooklyn Nets': { slug: 'bkn', sport: 'nba', league: 'team' },
      'New York Knicks': { slug: 'ny', sport: 'nba', league: 'team' },
      'Philadelphia 76ers': { slug: 'phi', sport: 'nba', league: 'team' },
      'Toronto Raptors': { slug: 'tor', sport: 'nba', league: 'team' },
      'Chicago Bulls': { slug: 'chi', sport: 'nba', league: 'team' },
      'Cleveland Cavaliers': { slug: 'cle', sport: 'nba', league: 'team' },
      'Detroit Pistons': { slug: 'det', sport: 'nba', league: 'team' },
      'Indiana Pacers': { slug: 'ind', sport: 'nba', league: 'team' },
      'Atlanta Hawks': { slug: 'atl', sport: 'nba', league: 'team' },
      'Charlotte Hornets': { slug: 'cha', sport: 'nba', league: 'team' },
      'Orlando Magic': { slug: 'orl', sport: 'nba', league: 'team' },
      'Washington Wizards': { slug: 'wsh', sport: 'nba', league: 'team' },
      'Houston Rockets': { slug: 'hou', sport: 'nba', league: 'team' },
      'Memphis Grizzlies': { slug: 'mem', sport: 'nba', league: 'team' },
      'New Orleans Pelicans': { slug: 'no', sport: 'nba', league: 'team' },
      'San Antonio Spurs': { slug: 'sa', sport: 'nba', league: 'team' },
      'Los Angeles Clippers': { slug: 'lac', sport: 'nba', league: 'team' },
      'Sacramento Kings': { slug: 'sac', sport: 'nba', league: 'team' },
      'Oklahoma City Thunder': { slug: 'okc', sport: 'nba', league: 'team' },
      'Portland Trail Blazers': { slug: 'por', sport: 'nba', league: 'team' },
      'Utah Jazz': { slug: 'uta', sport: 'nba', league: 'team' },
      'Minnesota Timberwolves': { slug: 'min', sport: 'nba', league: 'team' },
      // NFL Teams  
      'Dallas Cowboys': { slug: 'dal', sport: 'nfl', league: 'team' },
      'Kansas City Chiefs': { slug: 'kc', sport: 'nfl', league: 'team' },
      'San Francisco 49ers': { slug: 'sf', sport: 'nfl', league: 'team' },
      'Philadelphia Eagles': { slug: 'phi', sport: 'nfl', league: 'team' },
      'Buffalo Bills': { slug: 'buf', sport: 'nfl', league: 'team' },
      'Miami Dolphins': { slug: 'mia', sport: 'nfl', league: 'team' },
      'New England Patriots': { slug: 'ne', sport: 'nfl', league: 'team' },
      'Baltimore Ravens': { slug: 'bal', sport: 'nfl', league: 'team' },
      'Pittsburgh Steelers': { slug: 'pit', sport: 'nfl', league: 'team' },
      'Denver Broncos': { slug: 'den', sport: 'nfl', league: 'team' },
      'Green Bay Packers': { slug: 'gb', sport: 'nfl', league: 'team' },
      'Detroit Lions': { slug: 'det', sport: 'nfl', league: 'team' },
      'Minnesota Vikings': { slug: 'min', sport: 'nfl', league: 'team' },
      'Seattle Seahawks': { slug: 'sea', sport: 'nfl', league: 'team' },
      'Los Angeles Rams': { slug: 'lar', sport: 'nfl', league: 'team' },
      // NHL Teams
      'Boston Bruins': { slug: 'bos', sport: 'nhl', league: 'team' },
      'Toronto Maple Leafs': { slug: 'tor', sport: 'nhl', league: 'team' },
      'Tampa Bay Lightning': { slug: 'tb', sport: 'nhl', league: 'team' },
      'Colorado Avalanche': { slug: 'col', sport: 'nhl', league: 'team' },
      'Vegas Golden Knights': { slug: 'vgk', sport: 'nhl', league: 'team' },
      // MLB Teams
      'New York Yankees': { slug: 'nyy', sport: 'mlb', league: 'team' },
      'Los Angeles Dodgers': { slug: 'lad', sport: 'mlb', league: 'team' },
      'Atlanta Braves': { slug: 'atl', sport: 'mlb', league: 'team' },
    };
    
    const teamInfo = espnTeamMap[teamName];
    if (!teamInfo) {
      console.log(`Team "${teamName}" not found in espnTeamMap for multiple games lookup`);
      return games;
    }
    
    // If sport hint doesn't match, skip (e.g., searching for basketball but team is NFL)
    if (sportHint) {
      if (sportHint === 'basketball' && teamInfo.sport !== 'nba') return games;
      if (sportHint === 'football' && teamInfo.sport !== 'nfl') return games;
    }
    
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${
      teamInfo.sport === 'nba' ? 'basketball' :
      teamInfo.sport === 'nfl' ? 'football' :
      teamInfo.sport === 'nhl' ? 'hockey' : 'baseball'
    }/${teamInfo.sport}/teams/${teamInfo.slug}/schedule`;
    
    console.log(`Fetching multiple games from ESPN: ${scheduleUrl}`);
    const data = await cachedFetch(scheduleUrl, CACHE_TTL.SCHEDULE);
    
    if (!data?.events) {
      console.log('No events found in ESPN response for multiple games');
      return games;
    }
    
    const events = data.events;
    const now = new Date();
    console.log(`Found ${events.length} total ESPN events, filtering for upcoming games`);
    
    let upcomingCount = 0;
    for (const event of events) {
      if (upcomingCount >= limit) break;
      
      const eventDateTime = new Date(event.date);
      const status = event.competitions?.[0]?.status?.type?.name || '';
      const statusState = event.competitions?.[0]?.status?.type?.state || '';
      
      // Calculate how long ago the game started (in hours)
      const hoursAgo = (now.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
      
      console.log(`Event: ${event.shortName || event.name}, status: ${status}, state: ${statusState}, date: ${eventDateTime.toISOString()}, hoursAgo: ${hoursAgo.toFixed(2)}`);
      
      // Include: upcoming games, games in progress, or games that started recently (within 4 hours - could still be live)
      const isCompleted = status === 'STATUS_FINAL' || status === 'STATUS_POSTPONED' || status === 'STATUS_CANCELED';
      const isInProgress = status.includes('PROGRESS') || status === 'STATUS_HALFTIME' || status === 'STATUS_END_PERIOD' || statusState === 'in';
      const isUpcoming = eventDateTime > now || status === 'STATUS_SCHEDULED' || statusState === 'pre';
      const isRecentlyStarted = hoursAgo >= 0 && hoursAgo <= 4; // Games within last 4 hours might still be live
      
      // Skip only if completed 
      if (isCompleted) continue;
      
      // Include if upcoming, in progress, or recently started (not yet marked complete)
      if (!isUpcoming && !isInProgress && !isRecentlyStarted) continue;
      
      const gameInfo = extractGameInfo(event, eventDateTime);
      if (gameInfo) {
        games.push(gameInfo);
        upcomingCount++;
        console.log(`Added upcoming game #${upcomingCount}: ${gameInfo.eventName} at ${gameInfo.time}`);
      }
    }
    
    console.log(`Returning ${games.length} upcoming games for ${teamName}`);
    return games;
  } catch (error) {
    console.error('Error fetching multiple ESPN games:', error);
    return games;
  }
}

// Helper function to fetch ESPN schedule page and extract game time
// sportHint: 'basketball' | 'football' | null - helps disambiguate college teams
async function fetchESPNGameInfo(teamName: string, eventDate?: string, eventLink?: string, sportHint?: string): Promise<ESPNGameInfo | null> {
  try {
    let data: any | null = null;

    // 1) If we have a direct ESPN schedule link, derive the API URL from it (best signal)
    if (eventLink && eventLink.includes('espn.com')) {
      let scheduleUrl: string | null = null;

      // College football team schedule links look like:
      // https://www.espn.com/college-football/team/schedule/_/id/201/oklahoma-sooners
      if (eventLink.includes('/college-football/')) {
        const idMatch = eventLink.match(/id\/(\d+)/);
        if (idMatch) {
          const teamId = idMatch[1];
          scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/schedule`;
          
          // Also try scoreboard API for specific date if we have eventDate
          if (eventDate) {
            const dateStr = eventDate.replace(/-/g, '');
            const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${dateStr}&limit=100`;
            console.log(`Trying ESPN scoreboard for date: ${scoreboardUrl}`);
            
            // Use cached fetch for scoreboard
            const scoreboardData = await cachedFetch(scoreboardUrl, CACHE_TTL.SCOREBOARD);
            
            if (scoreboardData) {
              // Look for game involving this team
              const teamGame = scoreboardData.events?.find((event: any) => {
                const competitors = event.competitions?.[0]?.competitors || [];
                return competitors.some((c: any) => 
                  c.team?.id === teamId || 
                  c.team?.displayName?.toLowerCase().includes(teamName.toLowerCase().split(' ')[0])
                );
              });
              
              if (teamGame) {
                const eventDateTime = new Date(teamGame.date);
                console.log(`Found game on scoreboard: ${teamGame.name} at ${eventDateTime.toISOString()}`);
                return extractGameInfo(teamGame, eventDateTime);
              }
            }
          }
        }
      }

      if (scheduleUrl) {
        console.log(`Fetching ESPN schedule from event link: ${scheduleUrl}`);
        // Use cached fetch for schedule
        data = await cachedFetch(scheduleUrl, CACHE_TTL.SCHEDULE);
      }
    }

    // 2) Fallback: use team name mapping + search API if we still don't have data
    if (!data) {
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
        'LSU Tigers': { slug: 'lsu-tigers', sport: 'college-football', league: 'team' },
        'Nebraska Cornhuskers': { slug: 'nebraska-cornhuskers', sport: 'college-football', league: 'team' },
        'Oklahoma State Cowboys': { slug: 'oklahoma-state-cowboys', sport: 'college-football', league: 'team' },
        'Miami Hurricanes': { slug: 'miami-hurricanes', sport: 'college-football', league: 'team' },
        'Wisconsin Badgers': { slug: 'wisconsin-badgers', sport: 'college-football', league: 'team' },
        'Iowa Hawkeyes': { slug: 'iowa-hawkeyes', sport: 'college-football', league: 'team' },
        'Arkansas Razorbacks': { slug: 'arkansas-razorbacks', sport: 'college-football', league: 'team' },
        'Ole Miss Rebels': { slug: 'ole-miss-rebels', sport: 'college-football', league: 'team' },
        'Auburn Tigers': { slug: 'auburn-tigers', sport: 'college-football', league: 'team' },
        'South Carolina Gamecocks': { slug: 'south-carolina-gamecocks', sport: 'college-football', league: 'team' },
        'Kentucky Wildcats': { slug: 'kentucky-wildcats', sport: 'college-football', league: 'team' },
        'Missouri Tigers': { slug: 'missouri-tigers', sport: 'college-football', league: 'team' },
        'Mississippi State Bulldogs': { slug: 'mississippi-state-bulldogs', sport: 'college-football', league: 'team' },
        'Vanderbilt Commodores': { slug: 'vanderbilt-commodores', sport: 'college-football', league: 'team' },
        'Colorado Buffaloes': { slug: 'colorado-buffaloes', sport: 'college-football', league: 'team' },
        'Utah Utes': { slug: 'utah-utes', sport: 'college-football', league: 'team' },
        'Arizona Wildcats': { slug: 'arizona-wildcats', sport: 'college-football', league: 'team' },
        'Arizona State Sun Devils': { slug: 'arizona-state-sun-devils', sport: 'college-football', league: 'team' },
        'UCLA Bruins': { slug: 'ucla-bruins', sport: 'college-football', league: 'team' },
        'Washington Huskies': { slug: 'washington-huskies', sport: 'college-football', league: 'team' },
        'Washington State Cougars': { slug: 'washington-state-cougars', sport: 'college-football', league: 'team' },
        'Stanford Cardinal': { slug: 'stanford-cardinal', sport: 'college-football', league: 'team' },
        'California Golden Bears': { slug: 'california-golden-bears', sport: 'college-football', league: 'team' },
        'Baylor Bears': { slug: 'baylor-bears', sport: 'college-football', league: 'team' },
        'TCU Horned Frogs': { slug: 'tcu-horned-frogs', sport: 'college-football', league: 'team' },
        'Kansas Jayhawks': { slug: 'kansas-jayhawks', sport: 'college-football', league: 'team' },
        'Kansas State Wildcats': { slug: 'kansas-state-wildcats', sport: 'college-football', league: 'team' },
        'Iowa State Cyclones': { slug: 'iowa-state-cyclones', sport: 'college-football', league: 'team' },
        'West Virginia Mountaineers': { slug: 'west-virginia-mountaineers', sport: 'college-football', league: 'team' },
        'Cincinnati Bearcats': { slug: 'cincinnati-bearcats', sport: 'college-football', league: 'team' },
        'UCF Knights': { slug: 'ucf-knights', sport: 'college-football', league: 'team' },
        'Houston Cougars': { slug: 'houston-cougars', sport: 'college-football', league: 'team' },
        'BYU Cougars': { slug: 'byu-cougars', sport: 'college-football', league: 'team' },
        'Texas Tech Red Raiders': { slug: 'texas-tech-red-raiders', sport: 'college-football', league: 'team' },
        
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
        'Brooklyn Nets': { slug: 'bkn', sport: 'nba', league: 'team' },
        'New York Knicks': { slug: 'ny', sport: 'nba', league: 'team' },
        'Philadelphia 76ers': { slug: 'phi', sport: 'nba', league: 'team' },
        'Toronto Raptors': { slug: 'tor', sport: 'nba', league: 'team' },
        'Chicago Bulls': { slug: 'chi', sport: 'nba', league: 'team' },
        'Cleveland Cavaliers': { slug: 'cle', sport: 'nba', league: 'team' },
        'Detroit Pistons': { slug: 'det', sport: 'nba', league: 'team' },
        'Indiana Pacers': { slug: 'ind', sport: 'nba', league: 'team' },
        'Atlanta Hawks': { slug: 'atl', sport: 'nba', league: 'team' },
        'Charlotte Hornets': { slug: 'cha', sport: 'nba', league: 'team' },
        'Orlando Magic': { slug: 'orl', sport: 'nba', league: 'team' },
        'Washington Wizards': { slug: 'wsh', sport: 'nba', league: 'team' },
        'Houston Rockets': { slug: 'hou', sport: 'nba', league: 'team' },
        'Memphis Grizzlies': { slug: 'mem', sport: 'nba', league: 'team' },
        'New Orleans Pelicans': { slug: 'no', sport: 'nba', league: 'team' },
        'San Antonio Spurs': { slug: 'sa', sport: 'nba', league: 'team' },
        'Los Angeles Clippers': { slug: 'lac', sport: 'nba', league: 'team' },
        'Sacramento Kings': { slug: 'sac', sport: 'nba', league: 'team' },
        'Oklahoma City Thunder': { slug: 'okc', sport: 'nba', league: 'team' },
        'Portland Trail Blazers': { slug: 'por', sport: 'nba', league: 'team' },
        'Utah Jazz': { slug: 'uta', sport: 'nba', league: 'team' },
        'Minnesota Timberwolves': { slug: 'min', sport: 'nba', league: 'team' },
        
        // NHL Teams
        'Boston Bruins': { slug: 'bos', sport: 'nhl', league: 'team' },
        'Buffalo Sabres': { slug: 'buf', sport: 'nhl', league: 'team' },
        'Detroit Red Wings': { slug: 'det', sport: 'nhl', league: 'team' },
        'Florida Panthers': { slug: 'fla', sport: 'nhl', league: 'team' },
        'Montreal Canadiens': { slug: 'mtl', sport: 'nhl', league: 'team' },
        'Ottawa Senators': { slug: 'ott', sport: 'nhl', league: 'team' },
        'Tampa Bay Lightning': { slug: 'tb', sport: 'nhl', league: 'team' },
        'Toronto Maple Leafs': { slug: 'tor', sport: 'nhl', league: 'team' },
        'Carolina Hurricanes': { slug: 'car', sport: 'nhl', league: 'team' },
        'Columbus Blue Jackets': { slug: 'cbj', sport: 'nhl', league: 'team' },
        'New Jersey Devils': { slug: 'nj', sport: 'nhl', league: 'team' },
        'New York Islanders': { slug: 'nyi', sport: 'nhl', league: 'team' },
        'New York Rangers': { slug: 'nyr', sport: 'nhl', league: 'team' },
        'Philadelphia Flyers': { slug: 'phi', sport: 'nhl', league: 'team' },
        'Pittsburgh Penguins': { slug: 'pit', sport: 'nhl', league: 'team' },
        'Washington Capitals': { slug: 'wsh', sport: 'nhl', league: 'team' },
        'Arizona Coyotes': { slug: 'ari', sport: 'nhl', league: 'team' },
        'Chicago Blackhawks': { slug: 'chi', sport: 'nhl', league: 'team' },
        'Colorado Avalanche': { slug: 'col', sport: 'nhl', league: 'team' },
        'Dallas Stars': { slug: 'dal', sport: 'nhl', league: 'team' },
        'Minnesota Wild': { slug: 'min', sport: 'nhl', league: 'team' },
        'Nashville Predators': { slug: 'nsh', sport: 'nhl', league: 'team' },
        'St. Louis Blues': { slug: 'stl', sport: 'nhl', league: 'team' },
        'Winnipeg Jets': { slug: 'wpg', sport: 'nhl', league: 'team' },
        'Anaheim Ducks': { slug: 'ana', sport: 'nhl', league: 'team' },
        'Calgary Flames': { slug: 'cgy', sport: 'nhl', league: 'team' },
        'Edmonton Oilers': { slug: 'edm', sport: 'nhl', league: 'team' },
        'Los Angeles Kings': { slug: 'la', sport: 'nhl', league: 'team' },
        'San Jose Sharks': { slug: 'sj', sport: 'nhl', league: 'team' },
        'Seattle Kraken': { slug: 'sea', sport: 'nhl', league: 'team' },
        'Vancouver Canucks': { slug: 'van', sport: 'nhl', league: 'team' },
        'Vegas Golden Knights': { slug: 'vgk', sport: 'nhl', league: 'team' },
        
        // MLB Teams
        'Arizona Diamondbacks': { slug: 'ari', sport: 'mlb', league: 'team' },
        'Atlanta Braves': { slug: 'atl', sport: 'mlb', league: 'team' },
        'Baltimore Orioles': { slug: 'bal', sport: 'mlb', league: 'team' },
        'Boston Red Sox': { slug: 'bos', sport: 'mlb', league: 'team' },
        'Chicago Cubs': { slug: 'chc', sport: 'mlb', league: 'team' },
        'Chicago White Sox': { slug: 'chw', sport: 'mlb', league: 'team' },
        'Cincinnati Reds': { slug: 'cin', sport: 'mlb', league: 'team' },
        'Cleveland Guardians': { slug: 'cle', sport: 'mlb', league: 'team' },
        'Colorado Rockies': { slug: 'col', sport: 'mlb', league: 'team' },
        'Detroit Tigers': { slug: 'det', sport: 'mlb', league: 'team' },
        'Houston Astros': { slug: 'hou', sport: 'mlb', league: 'team' },
        'Kansas City Royals': { slug: 'kc', sport: 'mlb', league: 'team' },
        'Los Angeles Angels': { slug: 'laa', sport: 'mlb', league: 'team' },
        'Los Angeles Dodgers': { slug: 'lad', sport: 'mlb', league: 'team' },
        'Miami Marlins': { slug: 'mia', sport: 'mlb', league: 'team' },
        'Milwaukee Brewers': { slug: 'mil', sport: 'mlb', league: 'team' },
        'Minnesota Twins': { slug: 'min', sport: 'mlb', league: 'team' },
        'New York Mets': { slug: 'nym', sport: 'mlb', league: 'team' },
        'New York Yankees': { slug: 'nyy', sport: 'mlb', league: 'team' },
        'Oakland Athletics': { slug: 'oak', sport: 'mlb', league: 'team' },
        'Philadelphia Phillies': { slug: 'phi', sport: 'mlb', league: 'team' },
        'Pittsburgh Pirates': { slug: 'pit', sport: 'mlb', league: 'team' },
        'San Diego Padres': { slug: 'sd', sport: 'mlb', league: 'team' },
        'San Francisco Giants': { slug: 'sf', sport: 'mlb', league: 'team' },
        'Seattle Mariners': { slug: 'sea', sport: 'mlb', league: 'team' },
        'St. Louis Cardinals': { slug: 'stl', sport: 'mlb', league: 'team' },
        'Tampa Bay Rays': { slug: 'tb', sport: 'mlb', league: 'team' },
        'Texas Rangers': { slug: 'tex', sport: 'mlb', league: 'team' },
        'Toronto Blue Jays': { slug: 'tor', sport: 'mlb', league: 'team' },
        'Washington Nationals': { slug: 'wsh', sport: 'mlb', league: 'team' },
        
        // College Basketball - Top Programs (using "Basketball" suffix to avoid conflicts with football)
        'Duke Blue Devils': { slug: 'duke-blue-devils', sport: 'mens-college-basketball', league: 'team' },
        'North Carolina Tar Heels': { slug: 'north-carolina-tar-heels', sport: 'mens-college-basketball', league: 'team' },
        'Kansas Jayhawks Basketball': { slug: 'kansas-jayhawks', sport: 'mens-college-basketball', league: 'team' },
        'Kentucky Wildcats Basketball': { slug: 'kentucky-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'UCLA Bruins Basketball': { slug: 'ucla-bruins', sport: 'mens-college-basketball', league: 'team' },
        'Gonzaga Bulldogs': { slug: 'gonzaga-bulldogs', sport: 'mens-college-basketball', league: 'team' },
        'UConn Huskies': { slug: 'connecticut-huskies', sport: 'mens-college-basketball', league: 'team' },
        'Villanova Wildcats': { slug: 'villanova-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'Michigan State Spartans': { slug: 'michigan-state-spartans', sport: 'mens-college-basketball', league: 'team' },
        'Arizona Wildcats Basketball': { slug: 'arizona-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'Purdue Boilermakers': { slug: 'purdue-boilermakers', sport: 'mens-college-basketball', league: 'team' },
        'Houston Cougars Basketball': { slug: 'houston-cougars', sport: 'mens-college-basketball', league: 'team' },
        'Baylor Bears Basketball': { slug: 'baylor-bears', sport: 'mens-college-basketball', league: 'team' },
        'Indiana Hoosiers': { slug: 'indiana-hoosiers', sport: 'mens-college-basketball', league: 'team' },
        'Louisville Cardinals': { slug: 'louisville-cardinals', sport: 'mens-college-basketball', league: 'team' },
        'Syracuse Orange': { slug: 'syracuse-orange', sport: 'mens-college-basketball', league: 'team' },
        'Auburn Tigers Basketball': { slug: 'auburn-tigers', sport: 'mens-college-basketball', league: 'team' },
        'Arkansas Razorbacks Basketball': { slug: 'arkansas-razorbacks', sport: 'mens-college-basketball', league: 'team' },
        'Iowa Hawkeyes Basketball': { slug: 'iowa-hawkeyes', sport: 'mens-college-basketball', league: 'team' },
        'Wisconsin Badgers Basketball': { slug: 'wisconsin-badgers', sport: 'mens-college-basketball', league: 'team' },
        'Virginia Cavaliers': { slug: 'virginia-cavaliers', sport: 'mens-college-basketball', league: 'team' },
        'Marquette Golden Eagles': { slug: 'marquette-golden-eagles', sport: 'mens-college-basketball', league: 'team' },
        'Creighton Bluejays': { slug: 'creighton-bluejays', sport: 'mens-college-basketball', league: 'team' },
        'San Diego State Aztecs': { slug: 'san-diego-state-aztecs', sport: 'mens-college-basketball', league: 'team' },
        'Illinois Fighting Illini': { slug: 'illinois-fighting-illini', sport: 'mens-college-basketball', league: 'team' },
        'Xavier Musketeers': { slug: 'xavier-musketeers', sport: 'mens-college-basketball', league: 'team' },
        'Memphis Tigers': { slug: 'memphis-tigers', sport: 'mens-college-basketball', league: 'team' },
        'St. Johns Red Storm': { slug: 'st-johns-red-storm', sport: 'mens-college-basketball', league: 'team' },
        'Seton Hall Pirates': { slug: 'seton-hall-pirates', sport: 'mens-college-basketball', league: 'team' },
        'Georgetown Hoyas': { slug: 'georgetown-hoyas', sport: 'mens-college-basketball', league: 'team' },
        'Oklahoma State Cowboys Basketball': { slug: 'oklahoma-state-cowboys', sport: 'mens-college-basketball', league: 'team' },
        'Texas Tech Red Raiders Basketball': { slug: 'texas-tech-red-raiders', sport: 'mens-college-basketball', league: 'team' },
        'Oklahoma Sooners Basketball': { slug: 'oklahoma-sooners', sport: 'mens-college-basketball', league: 'team' },
        'TCU Horned Frogs Basketball': { slug: 'tcu-horned-frogs', sport: 'mens-college-basketball', league: 'team' },
        'West Virginia Mountaineers Basketball': { slug: 'west-virginia-mountaineers', sport: 'mens-college-basketball', league: 'team' },
        'Iowa State Cyclones Basketball': { slug: 'iowa-state-cyclones', sport: 'mens-college-basketball', league: 'team' },
        'Kansas State Wildcats Basketball': { slug: 'kansas-state-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'Cincinnati Bearcats Basketball': { slug: 'cincinnati-bearcats', sport: 'mens-college-basketball', league: 'team' },
        'BYU Cougars Basketball': { slug: 'byu-cougars', sport: 'mens-college-basketball', league: 'team' },
        'Colorado Buffaloes Basketball': { slug: 'colorado-buffaloes', sport: 'mens-college-basketball', league: 'team' },
        'Arizona State Sun Devils Basketball': { slug: 'arizona-state-sun-devils', sport: 'mens-college-basketball', league: 'team' },
        'Utah Utes Basketball': { slug: 'utah-utes', sport: 'mens-college-basketball', league: 'team' },
        'UCF Knights Basketball': { slug: 'ucf-knights', sport: 'mens-college-basketball', league: 'team' },
        'Texas Longhorns Basketball': { slug: 'texas-longhorns', sport: 'mens-college-basketball', league: 'team' },
        'Tennessee Volunteers Basketball': { slug: 'tennessee-volunteers', sport: 'mens-college-basketball', league: 'team' },
        'Florida Gators Basketball': { slug: 'florida-gators', sport: 'mens-college-basketball', league: 'team' },
        'Alabama Crimson Tide Basketball': { slug: 'alabama-crimson-tide', sport: 'mens-college-basketball', league: 'team' },
        'Michigan Wolverines Basketball': { slug: 'michigan-wolverines', sport: 'mens-college-basketball', league: 'team' },
        'Ohio State Buckeyes Basketball': { slug: 'ohio-state-buckeyes', sport: 'mens-college-basketball', league: 'team' },
        'North Carolina State Wolfpack': { slug: 'nc-state-wolfpack', sport: 'mens-college-basketball', league: 'team' },
        'Texas A&M Aggies Basketball': { slug: 'texas-am-aggies', sport: 'mens-college-basketball', league: 'team' },
        'Mississippi State Bulldogs Basketball': { slug: 'mississippi-state-bulldogs', sport: 'mens-college-basketball', league: 'team' },
        'Ole Miss Rebels Basketball': { slug: 'ole-miss-rebels', sport: 'mens-college-basketball', league: 'team' },
        'LSU Tigers Basketball': { slug: 'lsu-tigers', sport: 'mens-college-basketball', league: 'team' },
        'South Carolina Gamecocks Basketball': { slug: 'south-carolina-gamecocks', sport: 'mens-college-basketball', league: 'team' },
        'Missouri Tigers Basketball': { slug: 'missouri-tigers', sport: 'mens-college-basketball', league: 'team' },
        'Vanderbilt Commodores Basketball': { slug: 'vanderbilt-commodores', sport: 'mens-college-basketball', league: 'team' },
        'Georgia Bulldogs Basketball': { slug: 'georgia-bulldogs', sport: 'mens-college-basketball', league: 'team' },
        'Nebraska Cornhuskers Basketball': { slug: 'nebraska-cornhuskers', sport: 'mens-college-basketball', league: 'team' },
        
        // MLS Soccer Teams
        'LA Galaxy': { slug: 'la-galaxy', sport: 'soccer', league: 'usa.1' },
        'Los Angeles FC': { slug: 'lafc', sport: 'soccer', league: 'usa.1' },
        'LAFC': { slug: 'lafc', sport: 'soccer', league: 'usa.1' },
        'Inter Miami': { slug: 'inter-miami-cf', sport: 'soccer', league: 'usa.1' },
        'Inter Miami CF': { slug: 'inter-miami-cf', sport: 'soccer', league: 'usa.1' },
        'Atlanta United': { slug: 'atlanta-united-fc', sport: 'soccer', league: 'usa.1' },
        'Seattle Sounders': { slug: 'seattle-sounders-fc', sport: 'soccer', league: 'usa.1' },
        'Portland Timbers': { slug: 'portland-timbers', sport: 'soccer', league: 'usa.1' },
        'New York Red Bulls': { slug: 'new-york-red-bulls', sport: 'soccer', league: 'usa.1' },
        'New York City FC': { slug: 'new-york-city-fc', sport: 'soccer', league: 'usa.1' },
        'NYCFC': { slug: 'new-york-city-fc', sport: 'soccer', league: 'usa.1' },
        'Columbus Crew': { slug: 'columbus-crew', sport: 'soccer', league: 'usa.1' },
        'FC Cincinnati': { slug: 'fc-cincinnati', sport: 'soccer', league: 'usa.1' },
        'Philadelphia Union': { slug: 'philadelphia-union', sport: 'soccer', league: 'usa.1' },
        'Nashville SC': { slug: 'nashville-sc', sport: 'soccer', league: 'usa.1' },
        'Austin FC': { slug: 'austin-fc', sport: 'soccer', league: 'usa.1' },
        'FC Dallas': { slug: 'fc-dallas', sport: 'soccer', league: 'usa.1' },
        'Houston Dynamo': { slug: 'houston-dynamo-fc', sport: 'soccer', league: 'usa.1' },
        'Sporting Kansas City': { slug: 'sporting-kansas-city', sport: 'soccer', league: 'usa.1' },
        'Minnesota United': { slug: 'minnesota-united-fc', sport: 'soccer', league: 'usa.1' },
        'Real Salt Lake': { slug: 'real-salt-lake', sport: 'soccer', league: 'usa.1' },
        'Colorado Rapids': { slug: 'colorado-rapids', sport: 'soccer', league: 'usa.1' },
        'San Jose Earthquakes': { slug: 'san-jose-earthquakes', sport: 'soccer', league: 'usa.1' },
        'Vancouver Whitecaps': { slug: 'vancouver-whitecaps-fc', sport: 'soccer', league: 'usa.1' },
        'Toronto FC': { slug: 'toronto-fc', sport: 'soccer', league: 'usa.1' },
        'CF Montreal': { slug: 'cf-montreal', sport: 'soccer', league: 'usa.1' },
        'Chicago Fire': { slug: 'chicago-fire-fc', sport: 'soccer', league: 'usa.1' },
        'DC United': { slug: 'd.c.-united', sport: 'soccer', league: 'usa.1' },
        'Orlando City': { slug: 'orlando-city-sc', sport: 'soccer', league: 'usa.1' },
        'Charlotte FC': { slug: 'charlotte-fc', sport: 'soccer', league: 'usa.1' },
        'St Louis City SC': { slug: 'st.-louis-city-sc', sport: 'soccer', league: 'usa.1' },
        
        // Premier League Teams (Top 20)
        'Manchester United': { slug: 'man-united', sport: 'soccer', league: 'eng.1' },
        'Manchester City': { slug: 'man-city', sport: 'soccer', league: 'eng.1' },
        'Liverpool': { slug: 'liverpool', sport: 'soccer', league: 'eng.1' },
        'Arsenal': { slug: 'arsenal', sport: 'soccer', league: 'eng.1' },
        'Chelsea': { slug: 'chelsea', sport: 'soccer', league: 'eng.1' },
        'Tottenham': { slug: 'tottenham-hotspur', sport: 'soccer', league: 'eng.1' },
        'Tottenham Hotspur': { slug: 'tottenham-hotspur', sport: 'soccer', league: 'eng.1' },
        'Newcastle United': { slug: 'newcastle-united', sport: 'soccer', league: 'eng.1' },
        'Aston Villa': { slug: 'aston-villa', sport: 'soccer', league: 'eng.1' },
        'West Ham': { slug: 'west-ham-united', sport: 'soccer', league: 'eng.1' },
        'Brighton': { slug: 'brighton-and-hove-albion', sport: 'soccer', league: 'eng.1' },
        'Everton': { slug: 'everton', sport: 'soccer', league: 'eng.1' },
        'Fulham': { slug: 'fulham', sport: 'soccer', league: 'eng.1' },
        'Crystal Palace': { slug: 'crystal-palace', sport: 'soccer', league: 'eng.1' },
        'Brentford': { slug: 'brentford', sport: 'soccer', league: 'eng.1' },
        'Wolverhampton': { slug: 'wolverhampton-wanderers', sport: 'soccer', league: 'eng.1' },
        'Wolves': { slug: 'wolverhampton-wanderers', sport: 'soccer', league: 'eng.1' },
        'Nottingham Forest': { slug: 'nottingham-forest', sport: 'soccer', league: 'eng.1' },
        'Bournemouth': { slug: 'afc-bournemouth', sport: 'soccer', league: 'eng.1' },
        'Leicester City': { slug: 'leicester-city', sport: 'soccer', league: 'eng.1' },
        'Ipswich Town': { slug: 'ipswich-town', sport: 'soccer', league: 'eng.1' },
        'Southampton': { slug: 'southampton', sport: 'soccer', league: 'eng.1' },
        
        // La Liga Teams (Top teams)
        'Real Madrid': { slug: 'real-madrid', sport: 'soccer', league: 'esp.1' },
        'Barcelona': { slug: 'barcelona', sport: 'soccer', league: 'esp.1' },
        'Atletico Madrid': { slug: 'atletico-madrid', sport: 'soccer', league: 'esp.1' },
        'Sevilla': { slug: 'sevilla', sport: 'soccer', league: 'esp.1' },
        'Real Sociedad': { slug: 'real-sociedad', sport: 'soccer', league: 'esp.1' },
        'Real Betis': { slug: 'real-betis', sport: 'soccer', league: 'esp.1' },
        'Villarreal': { slug: 'villarreal-cf', sport: 'soccer', league: 'esp.1' },
        'Athletic Bilbao': { slug: 'athletic-club', sport: 'soccer', league: 'esp.1' },
        'Valencia': { slug: 'valencia-cf', sport: 'soccer', league: 'esp.1' },
        'Girona': { slug: 'girona-fc', sport: 'soccer', league: 'esp.1' },
      };

      // Find the team in our map
      let teamInfo = espnTeamMap[teamName];
      
      // Try exact match with "Basketball" suffix for college basketball searches
      if (!teamInfo && sportHint === 'basketball') {
        teamInfo = espnTeamMap[`${teamName} Basketball`];
        if (teamInfo) {
          console.log(`Exact match with Basketball suffix: ${teamName} Basketball`);
        }
      }
      
      // Try to find a partial match if exact match fails
      if (!teamInfo) {
        // Sort by key length descending to prioritize more specific matches
        // e.g., "Oklahoma State Cowboys" should be checked before partial matches
        const sortedEntries = Object.entries(espnTeamMap).sort((a, b) => b[0].length - a[0].length);
        
        for (const [key, value] of sortedEntries) {
          const keyLower = key.toLowerCase();
          const teamNameLower = teamName.toLowerCase();
          
          // Check if team name is contained in the key or vice versa
          // Use full team name comparison, not just first word
          if (keyLower.includes(teamNameLower) || teamNameLower.includes(keyLower.replace(' basketball', '').trim())) {
            // If we have a sport hint, prioritize matching sport
            if (sportHint === 'basketball' && value.sport === 'mens-college-basketball') {
              teamInfo = value;
              console.log(`Matched with basketball hint: ${key}`);
              break;
            } else if (sportHint === 'football' && (value.sport === 'college-football' || value.sport === 'nfl')) {
              teamInfo = value;
              console.log(`Matched with football hint: ${key}`);
              break;
            } else if (!sportHint) {
              teamInfo = value;
              break;
            }
          }
        }
      }
      
      // If still no match with hint, try without hint for broader match
      if (!teamInfo && sportHint) {
        for (const [key, value] of Object.entries(espnTeamMap)) {
          const keyLower = key.toLowerCase();
          const teamNameLower = teamName.toLowerCase();
          if (keyLower.includes(teamNameLower) || teamNameLower.includes(keyLower.replace(' basketball', '').trim())) {
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
      let espnApiUrl: string;
      switch (teamInfo.sport) {
        case 'college-football':
          // College football uses numeric team IDs - we need to get the ID first
          // Use full team name for accurate search
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1&search=${encodeURIComponent(teamName)}`;
          break;
        case 'nfl':
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamInfo.slug}/schedule`;
          break;
        case 'nba':
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamInfo.slug}/schedule`;
          break;
        case 'nhl':
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamInfo.slug}/schedule`;
          break;
        case 'mlb':
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamInfo.slug}/schedule`;
          break;
        case 'mens-college-basketball':
          // Use full team name for accurate search
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=1&search=${encodeURIComponent(teamName)}`;
          break;
        case 'soccer':
          // Soccer uses league-based lookups - e.g., usa.1 for MLS, eng.1 for Premier League
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${teamInfo.league}/teams?limit=1&search=${encodeURIComponent(teamName)}`;
          break;
        default:
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/${teamInfo.sport}/teams/${teamInfo.slug}/schedule`;
      }

      console.log(`Fetching ESPN schedule: ${espnApiUrl}`);
      
      // Determine TTL based on API type
      const isTeamSearch = espnApiUrl.includes('?limit=1&search=');
      const ttl = isTeamSearch ? CACHE_TTL.TEAM_SEARCH : CACHE_TTL.SCHEDULE;
      
      // Use cached fetch
      data = await cachedFetch(espnApiUrl, ttl);

      if (!data) {
        console.log(`ESPN API returned no data`);
        return null;
      }
      
      // For college teams and soccer, we need a second request to get the schedule
      if (teamInfo.sport === 'college-football' || teamInfo.sport === 'mens-college-basketball' || teamInfo.sport === 'soccer') {
        const teams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
        if (teams.length > 0) {
          const teamId = teams[0].team?.id || teams[0].id;
          let scheduleUrl: string;
          
          if (teamInfo.sport === 'soccer') {
            scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${teamInfo.league}/teams/${teamId}/schedule`;
          } else {
            const sport = teamInfo.sport === 'college-football' ? 'football/college-football' : 'basketball/mens-college-basketball';
            scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${teamId}/schedule`;
          }
          console.log(`Fetching team schedule: ${scheduleUrl}`);
          
          // Use cached fetch for schedule
          data = await cachedFetch(scheduleUrl, CACHE_TTL.SCHEDULE);
          
          if (!data) {
            console.log(`ESPN schedule API returned no data`);
            return null;
          }
        } else {
          console.log('No team found in ESPN search');
          return null;
        }
      }
    }

    if (!data) {
      console.log('No ESPN data available after all attempts');
      return null;
    }
    
    const events = data.events || [];
    console.log(`ESPN returned ${events.length} total events`);
    
    // Log raw event data for debugging
    if (events.length > 0) {
      console.log('=== ESPN RAW EVENT DATA (first 5 events) ===');
      events.slice(0, 5).forEach((event: any, idx: number) => {
        const eventDate = event.date ? new Date(event.date) : null;
        const competitions = event.competitions || [];
        const competitors = competitions[0]?.competitors || [];
        const team1 = competitors[0]?.team?.displayName || 'Unknown';
        const team2 = competitors[1]?.team?.displayName || 'Unknown';
        const statusName = competitions[0]?.status?.type?.name || 'Unknown';
        const broadcasts = competitions[0]?.broadcasts?.flatMap((b: any) => b.names || []) || [];
        
        console.log(`Event ${idx + 1}: ${event.name || event.shortName}`);
        console.log(`  Date: ${event.date} (parsed: ${eventDate?.toISOString()})`);
        console.log(`  Teams: ${team1} vs ${team2}`);
        console.log(`  Status: ${statusName}`);
        console.log(`  Broadcasts: ${broadcasts.join(', ') || 'None listed'}`);
        console.log(`  Is future: ${eventDate ? eventDate > new Date() : 'N/A'}`);
      });
      console.log('=== END ESPN RAW DATA ===');
    } else {
      console.log('ESPN returned ZERO events in data.events');
      console.log('ESPN data keys:', Object.keys(data));
      if (data.team) {
        console.log('Team info found:', data.team.displayName || data.team.name);
      }
    }
    
    // Find the event matching our requested date (allowing for timezone differences)
    if (eventDate) {
      const targetDate = new Date(eventDate);
      for (const event of events) {
        const eventDateStr = event.date;
        if (!eventDateStr) continue;

        const eventDateTime = new Date(eventDateStr);
        const diffMs = Math.abs(eventDateTime.getTime() - targetDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        console.log(`Comparing ESPN event date ${eventDateTime.toISOString()} with target ${targetDate.toISOString()} (diffDays=${diffDays})`);

        // Treat events within ~1 day as the same matchup to account for UTC vs local date shifts
        if (diffDays <= 1.1) {
          return extractGameInfo(event, eventDateTime);
        }
      }
    }
    
    // If no exact date match, find the next upcoming game
    const now = new Date();
    console.log(`Looking for next game after: ${now.toISOString()}`);
    for (const event of events) {
      const eventDateTime = new Date(event.date);
      console.log(`Checking event: ${event.name} at ${eventDateTime.toISOString()} > now? ${eventDateTime > now}`);
      if (eventDateTime > now) {
        console.log(`Found upcoming event: ${event.name}`);
        return extractGameInfo(event, eventDateTime);
      }
    }
    
    console.log('No upcoming events found after filtering');
    return null;
  } catch (error) {
    console.error('Error fetching ESPN schedule:', error);
    return null;
  }
}

// Helper to extract game info from ESPN event
function extractGameInfo(event: any, eventDateTime: Date): ESPNGameInfo {
  // Check if the event actually has a specific time or is TBD
  // ESPN returns midnight UTC (00:00:00Z) for TBD games
  const isTimeTBD = eventDateTime.getUTCHours() === 0 && 
                    eventDateTime.getUTCMinutes() === 0 && 
                    eventDateTime.getUTCSeconds() === 0;
  
  // Also check the status field for TBD indicators
  const competitions = event.competitions || [];
  const statusType = competitions[0]?.status?.type?.name || '';
  const statusState = competitions[0]?.status?.type?.state || '';
  const hasBroadcast = competitions[0]?.broadcasts?.length > 0;
  
  // Check if game is currently live/in progress (check both name and state)
  const isLive = statusType.includes('PROGRESS') || statusType === 'STATUS_HALFTIME' || statusType === 'STATUS_END_PERIOD' || statusState === 'in';
  
  // Also check if game started recently (within last 3 hours) and not marked final - likely still live
  const now = new Date();
  const hoursAgo = (now.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
  const recentlyStartedAndNotFinal = hoursAgo >= 0 && hoursAgo <= 3 && statusType !== 'STATUS_FINAL';
  
  let formattedTime: string;
  
  if (isLive || recentlyStartedAndNotFinal) {
    // Game is currently in progress - show "LIVE NOW" indicator
    formattedTime = '🔴 LIVE NOW';
  } else if (isTimeTBD && !hasBroadcast) {
    // Time is truly TBD - use manual Central Time formatter for date only
    formattedTime = formatTimeInCentral(eventDateTime, true) + ' - Time TBD';
  } else {
    // Use manual Central Time formatter (Deno doesn't support toLocaleString timeZone properly)
    formattedTime = formatTimeInCentral(eventDateTime);
  }
  
  // Extract opponent from competitions
  let opponent = '';
  let eventName = event.name || event.shortName || '';
  
  if (competitions.length > 0) {
    const competitors = competitions[0].competitors || [];
    // Try to find away team or the opponent
    if (competitors.length >= 2) {
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home')?.team;
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away')?.team;
      
      if (homeTeam && awayTeam) {
        const homeName = homeTeam.displayName || homeTeam.name || '';
        const awayName = awayTeam.displayName || awayTeam.name || '';
        opponent = `${awayName} at ${homeName}`;
        eventName = eventName || opponent;
      } else {
        const team1 = competitors[0]?.team?.displayName || competitors[0]?.team?.name || '';
        const team2 = competitors[1]?.team?.displayName || competitors[1]?.team?.name || '';
        opponent = `${team1} vs ${team2}`;
        eventName = eventName || opponent;
      }
    }
    
    // Extract broadcast info if available
    const broadcasts = competitions[0]?.broadcasts || [];
    if (broadcasts.length > 0) {
      const broadcastNames = broadcasts.flatMap((b: any) => 
        b.names || (b.media?.shortName ? [b.media.shortName] : [])
      );
      if (broadcastNames.length > 0) {
        console.log(`Broadcast channels from ESPN: ${broadcastNames.join(', ')}`);
      }
    }
  }
  
  console.log(`Found ESPN game: ${eventName} at ${formattedTime}`);
  
  // Include eventDate and full UTC timestamp from the eventDateTime
  const eventDateStr = eventDateTime.toISOString().split('T')[0];
  const eventDateTimeUTC = eventDateTime.toISOString();
  
  return { time: formattedTime, opponent, eventName, eventDate: eventDateStr, eventDateTimeUTC };
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
  
  console.log(`Checking if event is past - eventTime: "${eventTime}", eventDate: "${eventDate}", now: ${now.toISOString()}`);
  
  // If we have an ISO date, use it directly
  if (eventDate) {
    try {
      const eventDateTime = new Date(eventDate);
      // Include buffer for timezone issues (~1 day), but check vs current time
      // Event is past if it's more than 24 hours ago
      const diffMs = now.getTime() - eventDateTime.getTime();
      const oneDayMs = 1000 * 60 * 60 * 24;
      const isPast = diffMs > oneDayMs;
      console.log(`  Parsed eventDate: ${eventDateTime.toISOString()}, diffMs: ${diffMs}, isPast: ${isPast}`);
      return isPast;
    } catch {
      console.log(`  Failed to parse eventDate`);
      // Fall through to parse eventTime
    }
  }
  
  // Try to parse the time string
  try {
    // Common patterns: "December 19, 2025", "Aug 30, 2025", "November 2, 2025 at 2:30 PM"
    const dateStr = eventTime.replace(/\s+at\s+/i, ' ').replace(/\s+CT|\s+ET|\s+PT|\s+MT|\s+CDT|\s+CST|\s+EDT|\s+EST/gi, '');
    const eventDateTime = new Date(dateStr);
    
    if (!isNaN(eventDateTime.getTime())) {
      // Event is past if it's more than 24 hours ago (buffer for timezones)
      const diffMs = now.getTime() - eventDateTime.getTime();
      const oneDayMs = 1000 * 60 * 60 * 24;
      const isPast = diffMs > oneDayMs;
      console.log(`  Parsed eventTime: ${eventDateTime.toISOString()}, diffMs: ${diffMs}, isPast: ${isPast}`);
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

// Robust JSON parsing helper - handles markdown, extra text, etc.
function parseJSONRobust(content: string): any {
  // First try direct parse
  try {
    return JSON.parse(content);
  } catch {}
  
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {}
  
  // Find first { and last } for object extraction
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {}
  }
  
  // Try array extraction
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const jsonStr = cleaned.substring(arrStart, arrEnd + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {}
  }
  
  console.error('Failed to parse JSON from:', content.substring(0, 200));
  return null;
}

// Mapping of broadcast channels to streaming platforms
const channelToStreamingMap: Record<string, string[]> = {
  'ABC': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'DirecTV Stream'],
  'ESPN': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPN2': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPNU': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPNEWS': ['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'],
  'ESPN+': ['ESPN+'],
  'FOX': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'FS1': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'FS2': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'Fox Sports': ['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'],
  'CBS': ['Paramount+', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'CBS Sports Network': ['Paramount+', 'YouTube TV', 'Fubo', 'DirecTV Stream'],
  'NBC': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'Peacock': ['Peacock'],
  'Prime Video': ['Prime Video'],
  'Amazon Prime': ['Prime Video'],
  'TNT': ['Max', 'YouTube TV', 'Hulu + Live TV', 'DirecTV Stream'],
  'TBS': ['Max', 'YouTube TV', 'Hulu + Live TV', 'DirecTV Stream'],
  'truTV': ['Max', 'YouTube TV', 'Hulu + Live TV', 'DirecTV Stream'],
  'NFL Network': ['YouTube TV', 'Fubo', 'Sling Blue', 'DirecTV Stream'],
  'NBA TV': ['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'MLB Network': ['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'NHL Network': ['YouTube TV', 'Fubo', 'DirecTV Stream'],
  'USA Network': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  // College sports networks
  'SEC Network': ['ESPN+', 'Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'SEC Network+': ['ESPN+', 'ESPN App'],
  'Big Ten Network': ['Peacock', 'YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream'],
  'BTN': ['Peacock', 'YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream'],
  'ACC Network': ['ESPN+', 'Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'],
  'ACC Network Extra': ['ESPN+', 'ESPN App'],
  'Longhorn Network': ['ESPN+', 'Sling Orange'],
  'Big 12 Now': ['ESPN+'],
  'PAC-12 Network': ['Fubo', 'Sling Orange'],
  // Soccer channels
  'NBCSN': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'USA': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'],
  'Telemundo': ['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo'],
  'Universo': ['YouTube TV', 'Fubo'],
  'beIN Sports': ['Fubo', 'Sling Orange'],
  'Apple TV': ['Apple TV+'],
  'Apple TV+': ['Apple TV+'],
  'MLS Season Pass': ['Apple TV+'],
  // UFC/Boxing channels
  'PPV': ['ESPN+ PPV', 'DAZN'],
  'ESPN PPV': ['ESPN+ PPV'],
  'DAZN': ['DAZN'],
  'Showtime': ['Paramount+', 'YouTube TV', 'Fubo'],
  // Tennis channels
  'Tennis Channel': ['YouTube TV', 'Fubo', 'Sling Orange'],
  // Golf channels
  'Golf Channel': ['Peacock', 'YouTube TV', 'Fubo', 'Sling Blue'],
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
                content: `You are a sports broadcasting expert. Determine which major US broadcasting networks will show sports events.

IMPORTANT BROADCAST KNOWLEDGE:
- College Football Playoff (CFP) games are on ESPN/ABC
- NFL games: CBS, FOX, NBC, ESPN, Prime Video, NFL Network
- NBA games: TNT, ESPN, ABC, NBA TV
- College basketball: ESPN, ESPN2, CBS, FOX, FS1
- MLB playoffs: FOX, FS1, TBS
- NHL: ESPN, TNT, ABC
- MLS: Apple TV, ESPN, FOX

Identify the PRIMARY broadcast channel(s) from: ABC, ESPN, ESPN2, ESPN+, FOX, FS1, CBS, NBC, Peacock, Prime Video, TNT, TBS, NFL Network, NBA TV, MLB Network, USA Network.
Return ONLY a valid JSON object with broadcast_channels array. No markdown or explanation.`
              },
              {
                role: 'user',
                content: `Based on the following sports event information, identify which major US broadcasting networks will show this event. Use your knowledge of typical sports broadcasting rights.

EVENT DETAILS:
${eventDetails}

IMPORTANT: Even if broadcast info says "TBD", use your knowledge of the sport/league to determine likely broadcasters. For example:
- College football playoff games are on ESPN/ABC
- NFL primetime games are on ESPN, NBC, or Prime Video
- Major college bowl games are on ESPN networks

Respond with a JSON object like: {"broadcast_channels": ["ESPN", "ABC"]}
Only return empty array if you truly cannot determine any likely broadcasters.`
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
        
        const parsed = parseJSONRobust(content);
          
          if (parsed) {
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
          } else {
            console.error('Failed to parse platforms for:', event.eventName);
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
            
            const pricingParsed = parseJSONRobust(pricingContent);
              
              if (pricingParsed) {
                const platformDetails: PlatformInfo[] = pricingParsed.platforms || [];
                console.log(`Platform details for ${event.eventName}:`, platformDetails);
                return { ...event, streamingPlatforms, platformDetails };
              } else {
                console.error('Failed to parse pricing, using defaults');
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
  "bulls": "Chicago Bulls", "thunder": "Oklahoma City Thunder",
  "okc": "Oklahoma City Thunder", "pacers": "Indiana Pacers",
  "pistons": "Detroit Pistons", "hornets": "Charlotte Hornets",
  "sixers": "Philadelphia 76ers", "76ers": "Philadelphia 76ers",
  "cavs": "Cleveland Cavaliers", "cavaliers": "Cleveland Cavaliers",
  
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
  // Big 12 Basketball
  "red raiders": "Texas Tech Red Raiders", "tech": "Texas Tech Red Raiders",
  "cyclones": "Iowa State Cyclones", "horned frogs": "TCU Horned Frogs",
  "tcu": "TCU Horned Frogs", "mountaineers": "West Virginia Mountaineers",
  "wvu": "West Virginia Mountaineers", "bearcats": "Cincinnati Bearcats",
  "cincy": "Cincinnati Bearcats", "cougars": "Houston Cougars",
  "byu": "BYU Cougars", "buffs": "Colorado Buffaloes",
  "buffaloes": "Colorado Buffaloes", "utes": "Utah Utes",
  "sun devils": "Arizona State Sun Devils", "asu": "Arizona State Sun Devils",
  "ucf": "UCF Knights", "k-state": "Kansas State Wildcats",
  "pokes": "Oklahoma State Cowboys",
  // SEC Basketball
  "lsu": "LSU Tigers", "ole miss": "Ole Miss Rebels", "rebels": "Ole Miss Rebels",
  "gamecocks": "South Carolina Gamecocks", "mizzou": "Missouri Tigers",
  "commodores": "Vanderbilt Commodores", "vandy": "Vanderbilt Commodores",
  "wolfpack": "North Carolina State Wolfpack", "nc state": "North Carolina State Wolfpack",
  
  // Soccer - MLS
  "galaxy": "LA Galaxy", "la galaxy": "LA Galaxy",
  "lafc": "Los Angeles FC", "inter miami": "Inter Miami CF",
  "sounders": "Seattle Sounders", "timbers": "Portland Timbers",
  "red bulls": "New York Red Bulls", "nycfc": "New York City FC",
  "crew": "Columbus Crew", "union": "Philadelphia Union",
  "austin fc": "Austin FC", "dynamo": "Houston Dynamo",
  
  // Soccer - Premier League
  "man united": "Manchester United", "man u": "Manchester United", "united": "Manchester United",
  "man city": "Manchester City", "city": "Manchester City",
  "liverpool": "Liverpool", "reds": "Liverpool",
  "arsenal": "Arsenal", "gunners": "Arsenal",
  "chelsea": "Chelsea", "blues": "Chelsea",
  "tottenham spurs": "Tottenham Hotspur", "tottenham": "Tottenham Hotspur",
  "newcastle": "Newcastle United", "magpies": "Newcastle United",
  "villa": "Aston Villa", "west ham": "West Ham",
  "everton": "Everton", "toffees": "Everton",
  
  // Soccer - La Liga
  "real madrid": "Real Madrid", "madrid": "Real Madrid",
  "barca": "Barcelona", "barcelona": "Barcelona",
  "atletico": "Atletico Madrid", "sevilla": "Sevilla",
  
  // ============ COMMON MISSPELLINGS ============
  // NFL misspellings
  "cheifs": "Kansas City Chiefs", "chefs": "Kansas City Chiefs", "kc cheifs": "Kansas City Chiefs",
  "cowbys": "Dallas Cowboys", "cowbois": "Dallas Cowboys", "dalls cowboys": "Dallas Cowboys",
  "ninrs": "San Francisco 49ers", "nners": "San Francisco 49ers", "9ers": "San Francisco 49ers",
  "eagels": "Philadelphia Eagles", "egles": "Philadelphia Eagles", "philly eagles": "Philadelphia Eagles",
  "packrs": "Green Bay Packers", "greenbay": "Green Bay Packers",
  "stelers": "Pittsburgh Steelers", "steelrs": "Pittsburgh Steelers", "pitt steelers": "Pittsburgh Steelers",
  "ravnes": "Baltimore Ravens", "balitmore": "Baltimore Ravens", "bmore ravens": "Baltimore Ravens",
  "broncs": "Denver Broncos", "brocos": "Denver Broncos",
  "sehawks": "Seattle Seahawks", "seahwks": "Seattle Seahawks",
  "patritos": "New England Patriots", "patiots": "New England Patriots",
  "dolhpins": "Miami Dolphins", "dolfins": "Miami Dolphins",
  
  // NBA misspellings
  "lakrs": "Los Angeles Lakers", "lkaers": "Los Angeles Lakers", "la lakers": "Los Angeles Lakers",
  "wariors": "Golden State Warriors", "warriros": "Golden State Warriors", "gsw": "Golden State Warriors",
  "celitcs": "Boston Celtics", "cetics": "Boston Celtics",
  "buks": "Milwaukee Bucks", "bux": "Milwaukee Bucks",
  "knics": "New York Knicks", "nicks": "New York Knicks", "ny knicks": "New York Knicks",
  "mavricks": "Dallas Mavericks", "maveriks": "Dallas Mavericks",
  "sixxers": "Philadelphia 76ers", "sixrs": "Philadelphia 76ers",
  "thunders": "Oklahoma City Thunder", "okc thunder": "Oklahoma City Thunder",
  "nugets": "Denver Nuggets", "nuggts": "Denver Nuggets",
  "suuns": "Phoenix Suns", "phoneix suns": "Phoenix Suns",
  
  // MLB misspellings
  "yankess": "New York Yankees", "yankes": "New York Yankees", "ny yankees": "New York Yankees",
  "dodgrs": "Los Angeles Dodgers", "la dodgers": "Los Angeles Dodgers",
  "redsox": "Boston Red Sox", "red socks": "Boston Red Sox",
  "cubbs": "Chicago Cubs", "chicao cubs": "Chicago Cubs",
  "astro": "Houston Astros", "houton astros": "Houston Astros",
  "brves": "Atlanta Braves", "atlnta braves": "Atlanta Braves",
  
  // NHL misspellings
  "bruens": "Boston Bruins", "bruns": "Boston Bruins",
  "peguins": "Pittsburgh Penguins", "pengins": "Pittsburgh Penguins",
  "capitols": "Washington Capitals", "captials": "Washington Capitals",
  "maple leafs": "Toronto Maple Leafs", "leafes": "Toronto Maple Leafs",
  
  // College misspellings
  "alabma": "Alabama Crimson Tide", "bamma": "Alabama Crimson Tide",
  "ohoi state": "Ohio State Buckeyes", "ohio st": "Ohio State Buckeyes",
  "michgan": "Michigan Wolverines", "michagan": "Michigan Wolverines",
  "goergia": "Georgia Bulldogs", "georiga": "Georgia Bulldogs",
  "texsa": "Texas Longhorns", "teaxs": "Texas Longhorns",
  "okalhoma": "Oklahoma Sooners", "oklhoma": "Oklahoma Sooners",
  "notre dam": "Notre Dame Fighting Irish", "notredame": "Notre Dame Fighting Irish",
  
  // Soccer misspellings
  "manchster": "Manchester United", "manchetser": "Manchester United",
  "liverpol": "Liverpool", "liverpoool": "Liverpool",
  "chlesea": "Chelsea", "chelesa": "Chelsea",
  "arseanl": "Arsenal", "aresenal": "Arsenal",
  "barcleona": "Barcelona", "bareclona": "Barcelona",
  "real madird": "Real Madrid", "realmadrid": "Real Madrid",
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
  
  // OPTIMIZATION: If dictionary already resolved the query, skip AI call to save ~500ms latency
  // Only skip if the query was actually transformed and looks like a full team name
  if (preProcessed !== query && preProcessed.includes(' ')) {
    // Dictionary resolved it - just add context suffix and return
    const hasScheduleContext = /schedule|game|match|broadcast|next|tonight|today|tomorrow|this week/i.test(preProcessed);
    if (!hasScheduleContext) {
      console.log('Dictionary resolved query, skipping AI normalization');
      return preProcessed + ' next game schedule';
    }
    return preProcessed;
  }
  
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

CRITICAL: FIX TYPOS AND MISSPELLINGS FIRST
Before doing anything else, correct common typos and misspellings in team names:
- "lakrs", "lkaers" → "Lakers"
- "cheifs", "chefs" → "Chiefs"  
- "cowbys", "cowbois" → "Cowboys"
- "wariors", "warriros" → "Warriors"
- "celitcs", "cetics" → "Celtics"
- "yankess", "yankes" → "Yankees"
- "dodgrs" → "Dodgers"
- "manchster", "manchetser" → "Manchester"
- "liverpol" → "Liverpool"
- "barcleona" → "Barcelona"
Use your best judgment to identify and fix ANY misspelled team, player, or sport name.

TEAM NICKNAME DICTIONARY (partial list):
NFL: "niners" → "San Francisco 49ers", "cowboys" → "Dallas Cowboys", "chiefs" → "Kansas City Chiefs", "pats" → "New England Patriots"...
NBA: "dubs" → "Golden State Warriors", "lakers" → "Los Angeles Lakers", "warriors" → "Golden State Warriors", "celtics" → "Boston Celtics"...
MLB: "yanks" → "New York Yankees", "dodgers" → "Los Angeles Dodgers", "sox" → "Chicago White Sox"...
NHL: "bruins" → "Boston Bruins", "pens" → "Pittsburgh Penguins", "caps" → "Washington Capitals"...
College: "bama" → "Alabama Crimson Tide", "sooners" → "Oklahoma Sooners", "buckeyes" → "Ohio State Buckeyes"...
MLS Soccer: "galaxy" → "LA Galaxy", "lafc" → "Los Angeles FC", "inter miami" → "Inter Miami CF", "sounders" → "Seattle Sounders"...
Premier League: "man u" → "Manchester United", "arsenal" → "Arsenal", "chelsea" → "Chelsea", "liverpool" → "Liverpool"...
La Liga: "barca" → "Barcelona", "real madrid" → "Real Madrid", "atletico" → "Atletico Madrid"...

SPORTS DETECTION:
- UFC/MMA: Look for "UFC", "MMA", "fight", fighter names → add "UFC event schedule broadcast"
- Boxing: Look for boxing-related terms → add "boxing fight schedule broadcast"
- Tennis: Look for "US Open", "Wimbledon", "Australian Open", "French Open", "ATP", "WTA" → add "tennis schedule broadcast"
- Golf: Look for "PGA", "Masters", "US Open golf", "British Open", "Ryder Cup" → add "golf tournament schedule broadcast"
- Soccer: Look for "Premier League", "La Liga", "MLS", "Champions League", "World Cup" → add "soccer match schedule broadcast"

RULES:
1. ALWAYS fix typos and misspellings first - use context clues to determine the intended team
2. If any nickname or partial team name is detected, REPLACE it with the full official team name
3. Add sports context: "schedule", "next game", "upcoming match", or "broadcast information"
4. Ensure the query is optimized for retrieving live event schedules and broadcast info
5. For UFC/Boxing events, include event name and date if mentioned

EXAMPLES:
"lakrs game" → "Los Angeles Lakers basketball game schedule"
"cheifs vs broncos" → "Kansas City Chiefs vs Denver Broncos NFL game schedule"
"wariors tonight" → "Golden State Warriors basketball game tonight broadcast"
"manchster united" → "Manchester United Premier League match schedule"
"bama football" → "Alabama Crimson Tide football schedule"
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
    const lowerQuery = normalizedQuery.toLowerCase();
    
    // Step 0.5: For college team queries with sport hints, try direct ESPN lookup first
    // This bypasses Google PSE which often returns wrong results for similar team names
    const sportHint = lowerQuery.includes('basketball') ? 'basketball' : 
                      lowerQuery.includes('football') ? 'football' : null;
    
    // College teams that need disambiguation (similar names exist across schools)
    const collegeTeamMatches: Record<string, { name: string, espnId: string }> = {
      'oklahoma sooners': { name: 'Oklahoma Sooners', espnId: '201' },
      'oklahoma state cowboys': { name: 'Oklahoma State Cowboys', espnId: '197' },
      'texas longhorns': { name: 'Texas Longhorns', espnId: '251' },
      'texas tech red raiders': { name: 'Texas Tech Red Raiders', espnId: '2641' },
      'ohio state buckeyes': { name: 'Ohio State Buckeyes', espnId: '194' },
      'michigan wolverines': { name: 'Michigan Wolverines', espnId: '130' },
      'michigan state spartans': { name: 'Michigan State Spartans', espnId: '127' },
      'alabama crimson tide': { name: 'Alabama Crimson Tide', espnId: '333' },
      'auburn tigers': { name: 'Auburn Tigers', espnId: '2' },
      'georgia bulldogs': { name: 'Georgia Bulldogs', espnId: '61' },
      'florida gators': { name: 'Florida Gators', espnId: '57' },
      'florida state seminoles': { name: 'Florida State Seminoles', espnId: '52' },
      'lsu tigers': { name: 'LSU Tigers', espnId: '99' },
      'nebraska cornhuskers': { name: 'Nebraska Cornhuskers', espnId: '158' },
      'clemson tigers': { name: 'Clemson Tigers', espnId: '228' },
      'notre dame fighting irish': { name: 'Notre Dame Fighting Irish', espnId: '87' },
      'penn state nittany lions': { name: 'Penn State Nittany Lions', espnId: '213' },
      'oregon ducks': { name: 'Oregon Ducks', espnId: '2483' },
      'tennessee volunteers': { name: 'Tennessee Volunteers', espnId: '2633' },
      'usc trojans': { name: 'USC Trojans', espnId: '30' },
      'wisconsin badgers': { name: 'Wisconsin Badgers', espnId: '275' },
      'iowa hawkeyes': { name: 'Iowa Hawkeyes', espnId: '2294' },
      'arkansas razorbacks': { name: 'Arkansas Razorbacks', espnId: '8' },
      'ole miss rebels': { name: 'Ole Miss Rebels', espnId: '145' },
      'south carolina gamecocks': { name: 'South Carolina Gamecocks', espnId: '2579' },
      'kentucky wildcats': { name: 'Kentucky Wildcats', espnId: '96' },
      'miami hurricanes': { name: 'Miami Hurricanes', espnId: '2390' },
      'colorado buffaloes': { name: 'Colorado Buffaloes', espnId: '38' },
      'kansas jayhawks': { name: 'Kansas Jayhawks', espnId: '2305' },
      'baylor bears': { name: 'Baylor Bears', espnId: '239' },
      'tcu horned frogs': { name: 'TCU Horned Frogs', espnId: '2628' },
    };
    
    // Check if query matches a college team with sport hint
    let directCollegeMatch: { name: string, espnId: string } | null = null;
    for (const [key, value] of Object.entries(collegeTeamMatches)) {
      if (lowerQuery.includes(key)) {
        directCollegeMatch = value;
        console.log(`Direct college team match found: ${value.name} (ESPN ID: ${value.espnId})`);
        break;
      }
    }
    
    // If we have a college team with sport hint, do direct ESPN API lookup
    if (directCollegeMatch && sportHint) {
      console.log(`Bypassing Google PSE for college team: ${directCollegeMatch.name}, sport: ${sportHint}`);
      
      const sport = sportHint === 'basketball' ? 'mens-college-basketball' : 'college-football';
      const espnScheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportHint === 'basketball' ? 'basketball' : 'football'}/${sport}/teams/${directCollegeMatch.espnId}/schedule`;
      
      console.log(`Direct ESPN lookup URL: ${espnScheduleUrl}`);
      const espnData = await cachedFetch(espnScheduleUrl, CACHE_TTL.SCHEDULE);
      
      if (espnData?.events) {
        const now = new Date();
        // Find next upcoming game
        const upcomingGame = espnData.events.find((event: any) => {
          const gameDate = new Date(event.date);
          return gameDate > now;
        });
        
        if (upcomingGame) {
          const gameDate = new Date(upcomingGame.date);
          // Use manual timezone formatter (Deno doesn't support toLocaleString timeZone properly)
          const timeStr = formatTimeInCentral(gameDate);
          
          const competitors = upcomingGame.competitions?.[0]?.competitors || [];
          const homeTeam = competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
          const awayTeam = competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';
          const opponent = `${awayTeam} at ${homeTeam}`;
          
          // Get broadcast info
          const broadcasts = upcomingGame.competitions?.[0]?.broadcasts || [];
          const broadcastNames = broadcasts.flatMap((b: any) => b.names || []);
          
          const directEvent: LiveEvent = {
            eventName: upcomingGame.name || `${directCollegeMatch.name} ${sportHint === 'basketball' ? 'Basketball' : 'Football'}`,
            time: timeStr,
            participants: opponent,
            whereToWatch: broadcastNames.length > 0 ? broadcastNames.join(', ') : 'TBD',
            link: `https://www.espn.com/${sportHint === 'basketball' ? 'mens-college-basketball' : 'college-football'}/team/_/id/${directCollegeMatch.espnId}`,
            summary: `${directCollegeMatch.name} ${sportHint === 'basketball' ? 'basketball' : 'football'} game`,
            eventDate: gameDate.toISOString().split('T')[0],
            eventDateTimeUTC: gameDate.toISOString(),
            streamingPlatforms: broadcastNames,
          };
          
          console.log(`Direct ESPN found game: ${directEvent.eventName} at ${directEvent.time}`);
          
          // Enrich with streaming platforms
          const enrichedEvents = await enrichWithStreamingPlatforms([directEvent], LOVABLE_API_KEY!);
          
          return new Response(
            JSON.stringify({ events: enrichedEvents, aiProcessed: true, directESPNLookup: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log(`No upcoming games found for ${directCollegeMatch.name} ${sportHint}`);
          return new Response(
            JSON.stringify({ events: [], aiProcessed: true, directESPNLookup: true, message: `No upcoming ${sportHint} games found for ${directCollegeMatch.name}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      console.log('Direct ESPN lookup failed, falling back to Google PSE');
    }
    
    // Search with Google PSE using normalized query
    const searchQuery = `${normalizedQuery} live stream schedule broadcast`;
    console.log(`Searching Google PSE for: ${searchQuery}`);

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // If Google quota exceeded or error, fall back to ESPN-only lookup
    if (searchData.error) {
      console.error('Google PSE error:', JSON.stringify(searchData.error));
      
      // Check if it's a quota error - fall back to ESPN direct lookup
      if (searchData.error.code === 429 || searchData.error.status === 'RESOURCE_EXHAUSTED') {
        console.log('Google quota exceeded, falling back to ESPN-only lookup');
        
        // Try ESPN direct lookup with the normalized query
        const espnGameInfo = await fetchESPNGameInfo(normalizedQuery);
        
        if (espnGameInfo) {
          const fallbackEvent: LiveEvent = {
            eventName: espnGameInfo.eventName,
            time: espnGameInfo.time,
            participants: espnGameInfo.opponent ? `${normalizedQuery.split(' ')[0]} vs ${espnGameInfo.opponent}` : espnGameInfo.eventName,
            whereToWatch: 'TBD',
            link: `https://www.espn.com/search/_/q/${encodeURIComponent(normalizedQuery)}`,
            summary: `Upcoming game for ${normalizedQuery.replace(' schedule', '')}`,
            eventDate: espnGameInfo.eventDate,
          };
          
          // Enrich with streaming platforms
          const enrichedEvents = await enrichWithStreamingPlatforms([fallbackEvent], LOVABLE_API_KEY!);
          
          return new Response(
            JSON.stringify({ events: enrichedEvents, aiProcessed: true, fallbackUsed: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If ESPN lookup also fails, return a graceful empty result without throwing an error
        return new Response(
          JSON.stringify({ 
            events: [], 
            aiProcessed: false,
            fallbackUsed: true,
            quotaExceeded: true,
            message: 'Search quota exceeded for our main provider. We tried a direct schedule lookup but could not find any upcoming events. Try again tomorrow or search for a different team.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
    console.log('AI extraction raw response:', content.substring(0, 500));
    
    let events: LiveEvent[] = [];
    
    // Use robust JSON parsing
    const parsed = parseJSONRobust(content);
    
    if (parsed) {
      events = Array.isArray(parsed) ? parsed : [parsed];
      console.log(`AI extracted ${events.length} events before filtering`);
      
      // Filter out past events as a safety net
      const upcomingEvents = events.filter(event => !isEventInPast(event.time, event.eventDate));
      console.log(`Filtered ${events.length - upcomingEvents.length} past events, ${upcomingEvents.length} upcoming`);
      events = upcomingEvents;
    } else {
      console.error('Failed to parse AI response, using fallback');
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

    // Step 1.4: If AI returned few events (0-2) and we have a recognized team, try ESPN API for more games
    // This ensures users searching for a team get multiple upcoming games, not just 1
    if (events.length <= 2) {
      console.log(`AI returned only ${events.length} events, trying ESPN multi-game lookup for query:`, query);
      const preProcessed = preProcessQuery(query);
      const lowerQuery = preProcessed.toLowerCase();
      
      // Detect sport hint from query
      let sportHint: string | undefined;
      if (lowerQuery.includes('basketball') || lowerQuery.includes('hoops') || lowerQuery.includes('ncaab')) {
        sportHint = 'basketball';
        console.log('Sport hint detected: basketball');
      } else if (lowerQuery.includes('football') || lowerQuery.includes('ncaaf')) {
        sportHint = 'football';
        console.log('Sport hint detected: football');
      }
      
      let matchedTeam: string | null = null;
      
      // First, try to match against full team names from teamNicknames values
      const teamNicknamesList = [...new Set(Object.values(teamNicknames))];
      for (const teamName of teamNicknamesList) {
        if (lowerQuery.includes(teamName.toLowerCase())) {
          matchedTeam = teamName;
          console.log(`Matched full team name: ${teamName}`);
          break;
        }
      }
      
      // If no full name match, try partial matches on distinctive words
      if (!matchedTeam) {
        const distinctiveWords: Record<string, string> = {
          'thunder': 'Oklahoma City Thunder',
          'cavaliers': 'Cleveland Cavaliers', 'cavs': 'Cleveland Cavaliers',
          'timberwolves': 'Minnesota Timberwolves', 'wolves': 'Minnesota Timberwolves',
          'trail blazers': 'Portland Trail Blazers', 'blazers': 'Portland Trail Blazers',
          'golden state': 'Golden State Warriors', 'warriors': 'Golden State Warriors',
          'mavericks': 'Dallas Mavericks', 'mavs': 'Dallas Mavericks',
          'pelicans': 'New Orleans Pelicans', 'grizzlies': 'Memphis Grizzlies',
          'lakers': 'Los Angeles Lakers', 'clippers': 'Los Angeles Clippers',
          'celtics': 'Boston Celtics', 'knicks': 'New York Knicks',
          'nets': 'Brooklyn Nets', 'heat': 'Miami Heat', 'magic': 'Orlando Magic',
          'bucks': 'Milwaukee Bucks', 'bulls': 'Chicago Bulls', 'pacers': 'Indiana Pacers',
          'pistons': 'Detroit Pistons', 'hawks': 'Atlanta Hawks', 'hornets': 'Charlotte Hornets',
          'wizards': 'Washington Wizards', 'raptors': 'Toronto Raptors', 'suns': 'Phoenix Suns',
          'spurs': 'San Antonio Spurs', 'nuggets': 'Denver Nuggets', 'rockets': 'Houston Rockets',
          'jazz': 'Utah Jazz', 'kings': 'Sacramento Kings', 'sixers': 'Philadelphia 76ers',
        };
        
        for (const [keyword, teamName] of Object.entries(distinctiveWords)) {
          if (lowerQuery.includes(keyword)) {
            matchedTeam = teamName;
            console.log(`Matched distinctive word "${keyword}": ${teamName}`);
            break;
          }
        }
      }
      
      // If still no match, check the espnTeamMap keys directly
      if (!matchedTeam) {
        const espnTeamNames = [
          'Oklahoma City Thunder', 'Los Angeles Lakers', 'Golden State Warriors',
          'Boston Celtics', 'Milwaukee Bucks', 'Phoenix Suns', 'Dallas Mavericks',
          'Miami Heat', 'Denver Nuggets', 'Brooklyn Nets', 'New York Knicks',
          'Philadelphia 76ers', 'Toronto Raptors', 'Chicago Bulls', 'Cleveland Cavaliers',
          'Detroit Pistons', 'Indiana Pacers', 'Atlanta Hawks', 'Charlotte Hornets',
          'Orlando Magic', 'Washington Wizards', 'Houston Rockets', 'Memphis Grizzlies',
          'New Orleans Pelicans', 'San Antonio Spurs', 'Los Angeles Clippers',
          'Sacramento Kings', 'Portland Trail Blazers', 'Utah Jazz', 'Minnesota Timberwolves'
        ];
        
        for (const teamName of espnTeamNames) {
          // Check if any part of the team name is in the query
          const nameParts = teamName.toLowerCase().split(' ');
          const matchScore = nameParts.filter(part => lowerQuery.includes(part)).length;
          if (matchScore >= 2 || (matchScore === 1 && nameParts.length === 2)) {
            matchedTeam = teamName;
            console.log(`Matched via ESPN team list: ${teamName} (score: ${matchScore})`);
            break;
          }
        }
      }
      
      if (matchedTeam) {
        console.log(`Attempting multi-game ESPN lookup for team: ${matchedTeam} (sport hint: ${sportHint || 'none'})`);
        
        // Try to get multiple upcoming games first
        const multipleGames = await fetchMultipleESPNGames(matchedTeam, 5, sportHint);
        
        if (multipleGames.length > 0) {
          console.log(`Multi-game ESPN lookup found ${multipleGames.length} games`);
          events = multipleGames.map(game => ({
            eventName: game.eventName || `${matchedTeam} Game`,
            time: game.time,
            participants: game.opponent || matchedTeam,
            whereToWatch: 'TBD',
            link: `https://www.espn.com/search/_/q/${encodeURIComponent(matchedTeam)}`,
            summary: `Upcoming game for ${matchedTeam}`,
            eventDate: game.eventDate || new Date().toISOString().split('T')[0],
            eventDateTimeUTC: game.eventDateTimeUTC
          }));
        } else {
          // Fallback to single game lookup
          console.log(`Multi-game lookup returned 0, trying single game lookup`);
          const espnInfo = await fetchESPNGameInfo(matchedTeam, undefined, undefined, sportHint);
          
          if (espnInfo) {
            console.log(`Single ESPN lookup found game: ${espnInfo.eventName} at ${espnInfo.time}`);
            events = [{
              eventName: espnInfo.eventName || `${matchedTeam} Game`,
              time: espnInfo.time,
              participants: espnInfo.opponent || matchedTeam,
              whereToWatch: 'TBD',
              link: `https://www.espn.com/search/_/q/${encodeURIComponent(matchedTeam)}`,
              summary: `Upcoming game for ${matchedTeam}`,
              eventDate: espnInfo.eventDate || new Date().toISOString().split('T')[0],
              eventDateTimeUTC: espnInfo.eventDateTimeUTC
            }];
          } else {
            console.log(`ESPN lookup returned no info for ${matchedTeam}`);
          }
        }
      } else {
        console.log('No team matched from query');
      }
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
            console.log(`Looking up ESPN info for team: ${teamName}, date: ${event.eventDate}`);
            const espnInfo = await fetchESPNGameInfo(teamName, event.eventDate, event.link);
            if (espnInfo) {
              console.log(`Updated event from ESPN: time="${espnInfo.time}", opponent="${espnInfo.opponent}"`);
              return { 
                ...event, 
                time: espnInfo.time,
                participants: espnInfo.opponent || event.participants,
                eventName: event.eventName || espnInfo.eventName
              };
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
