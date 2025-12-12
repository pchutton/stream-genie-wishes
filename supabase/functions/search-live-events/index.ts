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
}

interface ESPNGameInfo {
  time: string;
  opponent: string;
  eventName: string;
}

// Helper function to fetch ESPN schedule page and extract game time
async function fetchESPNGameInfo(teamName: string, eventDate?: string, eventLink?: string): Promise<ESPNGameInfo | null> {
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
        'Kansas Jayhawks': { slug: 'kansas-jayhawks', sport: 'mens-college-basketball', league: 'team' },
        'Kentucky Wildcats': { slug: 'kentucky-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'UCLA Bruins': { slug: 'ucla-bruins', sport: 'mens-college-basketball', league: 'team' },
        'Gonzaga Bulldogs': { slug: 'gonzaga-bulldogs', sport: 'mens-college-basketball', league: 'team' },
        'UConn Huskies': { slug: 'connecticut-huskies', sport: 'mens-college-basketball', league: 'team' },
        'Villanova Wildcats': { slug: 'villanova-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'Michigan State Spartans': { slug: 'michigan-state-spartans', sport: 'mens-college-basketball', league: 'team' },
        'Arizona Wildcats': { slug: 'arizona-wildcats', sport: 'mens-college-basketball', league: 'team' },
        'Purdue Boilermakers': { slug: 'purdue-boilermakers', sport: 'mens-college-basketball', league: 'team' },
        'Houston Cougars': { slug: 'houston-cougars', sport: 'mens-college-basketball', league: 'team' },
        'Baylor Bears': { slug: 'baylor-bears', sport: 'mens-college-basketball', league: 'team' },
        'Indiana Hoosiers': { slug: 'indiana-hoosiers', sport: 'mens-college-basketball', league: 'team' },
        'Louisville Cardinals': { slug: 'louisville-cardinals', sport: 'mens-college-basketball', league: 'team' },
        'Syracuse Orange': { slug: 'syracuse-orange', sport: 'mens-college-basketball', league: 'team' },
        'Auburn Tigers': { slug: 'auburn-tigers', sport: 'mens-college-basketball', league: 'team' },
        'Arkansas Razorbacks': { slug: 'arkansas-razorbacks', sport: 'mens-college-basketball', league: 'team' },
        'Iowa Hawkeyes': { slug: 'iowa-hawkeyes', sport: 'mens-college-basketball', league: 'team' },
        'Wisconsin Badgers': { slug: 'wisconsin-badgers', sport: 'mens-college-basketball', league: 'team' },
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
      let espnApiUrl: string;
      switch (teamInfo.sport) {
        case 'college-football':
          // College football uses numeric team IDs - we need to get the ID first
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1&search=${encodeURIComponent(teamName.split(' ')[0])}`;
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
          espnApiUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=1&search=${encodeURIComponent(teamName.split(' ')[0])}`;
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
      
      // For college teams, we need a second request to get the schedule
      if (teamInfo.sport === 'college-football' || teamInfo.sport === 'mens-college-basketball') {
        const teams = data.sports?.[0]?.leagues?.[0]?.teams || data.teams || [];
        if (teams.length > 0) {
          const teamId = teams[0].team?.id || teams[0].id;
          const sport = teamInfo.sport === 'college-football' ? 'football/college-football' : 'basketball/mens-college-basketball';
          const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${teamId}/schedule`;
          console.log(`Fetching college team schedule: ${scheduleUrl}`);
          
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
    for (const event of events) {
      const eventDateTime = new Date(event.date);
      if (eventDateTime > now) {
        return extractGameInfo(event, eventDateTime);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching ESPN schedule:', error);
    return null;
  }
}

// Helper to extract game info from ESPN event
function extractGameInfo(event: any, eventDateTime: Date): ESPNGameInfo {
  console.log('Raw ESPN event:', JSON.stringify(event, null, 2));
  // Check if the event actually has a specific time or is TBD
  // ESPN returns midnight UTC (00:00:00Z) for TBD games
  const isTimeTBD = eventDateTime.getUTCHours() === 0 && 
                    eventDateTime.getUTCMinutes() === 0 && 
                    eventDateTime.getUTCSeconds() === 0;
  
  // Also check the status field for TBD indicators
  const competitions = event.competitions || [];
  const statusType = competitions[0]?.status?.type?.name || '';
  const hasBroadcast = competitions[0]?.broadcasts?.length > 0;
  
  let formattedTime: string;
  
  if (isTimeTBD && !hasBroadcast) {
    // Time is truly TBD - just format the date
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    formattedTime = eventDateTime.toLocaleDateString('en-US', dateOptions) + ' - Time TBD';
  } else {
    // Format with Central Time for US sports
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    // Use Central Time as primary since user appears to be in CT
    formattedTime = eventDateTime.toLocaleString('en-US', { ...options, timeZone: 'America/Chicago' });
    
    // Also provide EST for reference if different
    const estTime = eventDateTime.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    const cstTime = eventDateTime.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });
    
    // If times are different, append EST equivalent
    if (estTime !== cstTime) {
      formattedTime = formattedTime.replace(' CST', ' CT').replace(' CDT', ' CT');
    }
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
  return { time: formattedTime, opponent, eventName };
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
    console.log('AI extraction raw response:', content.substring(0, 500));
    
    let events: LiveEvent[] = [];
    try {
      // Try to parse the AI response as JSON
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      events = JSON.parse(cleanContent);
      
      if (!Array.isArray(events)) {
        events = [events];
      }
      
      console.log(`AI extracted ${events.length} events before filtering`);
      
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

    // Step 1.4: If AI returned 0 events but we have a recognized team, try ESPN API directly
    if (events.length === 0) {
      console.log('No events from AI, trying direct ESPN lookup for query:', query);
      const preProcessed = preProcessQuery(query);
      const lowerQuery = preProcessed.toLowerCase();
      
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
        console.log(`Attempting direct ESPN lookup for team: ${matchedTeam}`);
        const espnInfo = await fetchESPNGameInfo(matchedTeam);
        
        if (espnInfo) {
          console.log(`Direct ESPN lookup found game: ${espnInfo.eventName} at ${espnInfo.time}`);
          events = [{
            eventName: espnInfo.eventName || `${matchedTeam} Game`,
            time: espnInfo.time,
            participants: espnInfo.opponent || matchedTeam,
            whereToWatch: 'TBD',
            link: `https://www.espn.com/search/_/q/${encodeURIComponent(matchedTeam)}`,
            summary: `Upcoming game for ${matchedTeam}`,
            eventDate: new Date().toISOString().split('T')[0]
          }];
        } else {
          console.log(`ESPN lookup returned no info for ${matchedTeam}`);
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
