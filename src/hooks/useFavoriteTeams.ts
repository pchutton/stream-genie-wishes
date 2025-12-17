import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type SportLeague = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'MLS' | 'NCAAF' | 'NCAAB';

export interface FavoriteTeam {
  id: string;
  user_id: string;
  team_name: string;
  league: SportLeague;
  espn_team_id: string | null;
  created_at: string;
}

// ESPN Team IDs for major US leagues
export const LEAGUE_TEAMS: Record<SportLeague, { name: string; espnId: string }[]> = {
  NFL: [
    { name: 'Arizona Cardinals', espnId: '22' },
    { name: 'Atlanta Falcons', espnId: '1' },
    { name: 'Baltimore Ravens', espnId: '33' },
    { name: 'Buffalo Bills', espnId: '2' },
    { name: 'Carolina Panthers', espnId: '29' },
    { name: 'Chicago Bears', espnId: '3' },
    { name: 'Cincinnati Bengals', espnId: '4' },
    { name: 'Cleveland Browns', espnId: '5' },
    { name: 'Dallas Cowboys', espnId: '6' },
    { name: 'Denver Broncos', espnId: '7' },
    { name: 'Detroit Lions', espnId: '8' },
    { name: 'Green Bay Packers', espnId: '9' },
    { name: 'Houston Texans', espnId: '34' },
    { name: 'Indianapolis Colts', espnId: '11' },
    { name: 'Jacksonville Jaguars', espnId: '30' },
    { name: 'Kansas City Chiefs', espnId: '12' },
    { name: 'Las Vegas Raiders', espnId: '13' },
    { name: 'Los Angeles Chargers', espnId: '24' },
    { name: 'Los Angeles Rams', espnId: '14' },
    { name: 'Miami Dolphins', espnId: '15' },
    { name: 'Minnesota Vikings', espnId: '16' },
    { name: 'New England Patriots', espnId: '17' },
    { name: 'New Orleans Saints', espnId: '18' },
    { name: 'New York Giants', espnId: '19' },
    { name: 'New York Jets', espnId: '20' },
    { name: 'Philadelphia Eagles', espnId: '21' },
    { name: 'Pittsburgh Steelers', espnId: '23' },
    { name: 'San Francisco 49ers', espnId: '25' },
    { name: 'Seattle Seahawks', espnId: '26' },
    { name: 'Tampa Bay Buccaneers', espnId: '27' },
    { name: 'Tennessee Titans', espnId: '10' },
    { name: 'Washington Commanders', espnId: '28' },
  ],
  NBA: [
    { name: 'Atlanta Hawks', espnId: '1' },
    { name: 'Boston Celtics', espnId: '2' },
    { name: 'Brooklyn Nets', espnId: '17' },
    { name: 'Charlotte Hornets', espnId: '30' },
    { name: 'Chicago Bulls', espnId: '4' },
    { name: 'Cleveland Cavaliers', espnId: '5' },
    { name: 'Dallas Mavericks', espnId: '6' },
    { name: 'Denver Nuggets', espnId: '7' },
    { name: 'Detroit Pistons', espnId: '8' },
    { name: 'Golden State Warriors', espnId: '9' },
    { name: 'Houston Rockets', espnId: '10' },
    { name: 'Indiana Pacers', espnId: '11' },
    { name: 'LA Clippers', espnId: '12' },
    { name: 'Los Angeles Lakers', espnId: '13' },
    { name: 'Memphis Grizzlies', espnId: '29' },
    { name: 'Miami Heat', espnId: '14' },
    { name: 'Milwaukee Bucks', espnId: '15' },
    { name: 'Minnesota Timberwolves', espnId: '16' },
    { name: 'New Orleans Pelicans', espnId: '3' },
    { name: 'New York Knicks', espnId: '18' },
    { name: 'Oklahoma City Thunder', espnId: '25' },
    { name: 'Orlando Magic', espnId: '19' },
    { name: 'Philadelphia 76ers', espnId: '20' },
    { name: 'Phoenix Suns', espnId: '21' },
    { name: 'Portland Trail Blazers', espnId: '22' },
    { name: 'Sacramento Kings', espnId: '23' },
    { name: 'San Antonio Spurs', espnId: '24' },
    { name: 'Toronto Raptors', espnId: '28' },
    { name: 'Utah Jazz', espnId: '26' },
    { name: 'Washington Wizards', espnId: '27' },
  ],
  MLB: [
    { name: 'Arizona Diamondbacks', espnId: '29' },
    { name: 'Atlanta Braves', espnId: '15' },
    { name: 'Baltimore Orioles', espnId: '1' },
    { name: 'Boston Red Sox', espnId: '2' },
    { name: 'Chicago Cubs', espnId: '16' },
    { name: 'Chicago White Sox', espnId: '4' },
    { name: 'Cincinnati Reds', espnId: '17' },
    { name: 'Cleveland Guardians', espnId: '5' },
    { name: 'Colorado Rockies', espnId: '27' },
    { name: 'Detroit Tigers', espnId: '6' },
    { name: 'Houston Astros', espnId: '18' },
    { name: 'Kansas City Royals', espnId: '7' },
    { name: 'Los Angeles Angels', espnId: '3' },
    { name: 'Los Angeles Dodgers', espnId: '19' },
    { name: 'Miami Marlins', espnId: '28' },
    { name: 'Milwaukee Brewers', espnId: '8' },
    { name: 'Minnesota Twins', espnId: '9' },
    { name: 'New York Mets', espnId: '21' },
    { name: 'New York Yankees', espnId: '10' },
    { name: 'Oakland Athletics', espnId: '11' },
    { name: 'Philadelphia Phillies', espnId: '22' },
    { name: 'Pittsburgh Pirates', espnId: '23' },
    { name: 'San Diego Padres', espnId: '25' },
    { name: 'San Francisco Giants', espnId: '26' },
    { name: 'Seattle Mariners', espnId: '12' },
    { name: 'St. Louis Cardinals', espnId: '24' },
    { name: 'Tampa Bay Rays', espnId: '30' },
    { name: 'Texas Rangers', espnId: '13' },
    { name: 'Toronto Blue Jays', espnId: '14' },
    { name: 'Washington Nationals', espnId: '20' },
  ],
  NHL: [
    { name: 'Anaheim Ducks', espnId: '25' },
    { name: 'Arizona Coyotes', espnId: '53' },
    { name: 'Boston Bruins', espnId: '1' },
    { name: 'Buffalo Sabres', espnId: '2' },
    { name: 'Calgary Flames', espnId: '20' },
    { name: 'Carolina Hurricanes', espnId: '7' },
    { name: 'Chicago Blackhawks', espnId: '4' },
    { name: 'Colorado Avalanche', espnId: '17' },
    { name: 'Columbus Blue Jackets', espnId: '29' },
    { name: 'Dallas Stars', espnId: '9' },
    { name: 'Detroit Red Wings', espnId: '5' },
    { name: 'Edmonton Oilers', espnId: '22' },
    { name: 'Florida Panthers', espnId: '26' },
    { name: 'Los Angeles Kings', espnId: '8' },
    { name: 'Minnesota Wild', espnId: '30' },
    { name: 'Montreal Canadiens', espnId: '15' },
    { name: 'Nashville Predators', espnId: '18' },
    { name: 'New Jersey Devils', espnId: '19' },
    { name: 'New York Islanders', espnId: '12' },
    { name: 'New York Rangers', espnId: '13' },
    { name: 'Ottawa Senators', espnId: '16' },
    { name: 'Philadelphia Flyers', espnId: '14' },
    { name: 'Pittsburgh Penguins', espnId: '3' },
    { name: 'San Jose Sharks', espnId: '24' },
    { name: 'Seattle Kraken', espnId: '55' },
    { name: 'St. Louis Blues', espnId: '6' },
    { name: 'Tampa Bay Lightning', espnId: '27' },
    { name: 'Toronto Maple Leafs', espnId: '28' },
    { name: 'Vancouver Canucks', espnId: '23' },
    { name: 'Vegas Golden Knights', espnId: '54' },
    { name: 'Washington Capitals', espnId: '21' },
    { name: 'Winnipeg Jets', espnId: '52' },
  ],
  MLS: [
    { name: 'Atlanta United FC', espnId: '5513' },
    { name: 'Austin FC', espnId: '18601' },
    { name: 'Charlotte FC', espnId: '18620' },
    { name: 'Chicago Fire FC', espnId: '167' },
    { name: 'FC Cincinnati', espnId: '5514' },
    { name: 'Colorado Rapids', espnId: '174' },
    { name: 'Columbus Crew', espnId: '162' },
    { name: 'D.C. United', espnId: '163' },
    { name: 'FC Dallas', espnId: '165' },
    { name: 'Houston Dynamo FC', espnId: '192' },
    { name: 'Inter Miami CF', espnId: '18600' },
    { name: 'LA Galaxy', espnId: '166' },
    { name: 'Los Angeles FC', espnId: '5512' },
    { name: 'Minnesota United FC', espnId: '197' },
    { name: 'CF Montreal', espnId: '194' },
    { name: 'Nashville SC', espnId: '18598' },
    { name: 'New England Revolution', espnId: '169' },
    { name: 'New York City FC', espnId: '195' },
    { name: 'New York Red Bulls', espnId: '170' },
    { name: 'Orlando City SC', espnId: '196' },
    { name: 'Philadelphia Union', espnId: '193' },
    { name: 'Portland Timbers', espnId: '186' },
    { name: 'Real Salt Lake', espnId: '176' },
    { name: 'San Jose Earthquakes', espnId: '171' },
    { name: 'Seattle Sounders FC', espnId: '172' },
    { name: 'Sporting Kansas City', espnId: '168' },
    { name: 'St. Louis City SC', espnId: '22379' },
    { name: 'Toronto FC', espnId: '177' },
    { name: 'Vancouver Whitecaps FC', espnId: '178' },
  ],
  NCAAF: [
    { name: 'Alabama Crimson Tide', espnId: '333' },
    { name: 'Auburn Tigers', espnId: '2' },
    { name: 'Clemson Tigers', espnId: '228' },
    { name: 'Florida Gators', espnId: '57' },
    { name: 'Georgia Bulldogs', espnId: '61' },
    { name: 'LSU Tigers', espnId: '99' },
    { name: 'Michigan Wolverines', espnId: '130' },
    { name: 'Notre Dame Fighting Irish', espnId: '87' },
    { name: 'Ohio State Buckeyes', espnId: '194' },
    { name: 'Oklahoma Sooners', espnId: '201' },
    { name: 'Oregon Ducks', espnId: '2483' },
    { name: 'Penn State Nittany Lions', espnId: '213' },
    { name: 'Tennessee Volunteers', espnId: '2633' },
    { name: 'Texas Longhorns', espnId: '251' },
    { name: 'USC Trojans', espnId: '30' },
  ],
  NCAAB: [
    // Blue Bloods & Top Programs
    { name: 'Duke Blue Devils', espnId: '150' },
    { name: 'Kansas Jayhawks', espnId: '2305' },
    { name: 'Kentucky Wildcats', espnId: '96' },
    { name: 'North Carolina Tar Heels', espnId: '153' },
    { name: 'UCLA Bruins', espnId: '26' },
    { name: 'Gonzaga Bulldogs', espnId: '2250' },
    { name: 'Villanova Wildcats', espnId: '222' },
    { name: 'Michigan State Spartans', espnId: '127' },
    { name: 'Arizona Wildcats', espnId: '12' },
    { name: 'UConn Huskies', espnId: '41' },
    // Big 12
    { name: 'Oklahoma Sooners', espnId: '201' },
    { name: 'Oklahoma State Cowboys', espnId: '197' },
    { name: 'Texas Longhorns', espnId: '251' },
    { name: 'Texas Tech Red Raiders', espnId: '2641' },
    { name: 'Baylor Bears', espnId: '239' },
    { name: 'Iowa State Cyclones', espnId: '66' },
    { name: 'TCU Horned Frogs', espnId: '2628' },
    { name: 'West Virginia Mountaineers', espnId: '277' },
    { name: 'Cincinnati Bearcats', espnId: '2132' },
    { name: 'Houston Cougars', espnId: '248' },
    { name: 'BYU Cougars', espnId: '252' },
    { name: 'UCF Knights', espnId: '2116' },
    { name: 'Colorado Buffaloes', espnId: '38' },
    { name: 'Arizona State Sun Devils', espnId: '9' },
    { name: 'Utah Utes', espnId: '254' },
    { name: 'Kansas State Wildcats', espnId: '2306' },
    // SEC
    { name: 'Alabama Crimson Tide', espnId: '333' },
    { name: 'Auburn Tigers', espnId: '2' },
    { name: 'Tennessee Volunteers', espnId: '2633' },
    { name: 'Florida Gators', espnId: '57' },
    { name: 'Texas A&M Aggies', espnId: '245' },
    { name: 'LSU Tigers', espnId: '99' },
    { name: 'Ole Miss Rebels', espnId: '145' },
    { name: 'Mississippi State Bulldogs', espnId: '344' },
    { name: 'Arkansas Razorbacks', espnId: '8' },
    { name: 'South Carolina Gamecocks', espnId: '2579' },
    { name: 'Missouri Tigers', espnId: '142' },
    { name: 'Vanderbilt Commodores', espnId: '238' },
    { name: 'Georgia Bulldogs', espnId: '61' },
    // ACC
    { name: 'NC State Wolfpack', espnId: '152' },
    { name: 'Virginia Cavaliers', espnId: '258' },
    { name: 'Wake Forest Demon Deacons', espnId: '154' },
    { name: 'Syracuse Orange', espnId: '183' },
    { name: 'Louisville Cardinals', espnId: '97' },
    // Big Ten
    { name: 'Michigan Wolverines', espnId: '130' },
    { name: 'Ohio State Buckeyes', espnId: '194' },
    { name: 'Purdue Boilermakers', espnId: '2509' },
    { name: 'Indiana Hoosiers', espnId: '84' },
    { name: 'Illinois Fighting Illini', espnId: '356' },
    { name: 'Iowa Hawkeyes', espnId: '2294' },
    { name: 'Wisconsin Badgers', espnId: '275' },
  ],
};

export function useFavoriteTeams() {
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorite_teams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Cast the data to handle the enum type
      setTeams((data || []) as FavoriteTeam[]);
    } catch (err) {
      console.error('Error fetching favorite teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const addTeam = async (teamName: string, league: SportLeague) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save favorite teams',
        variant: 'destructive',
      });
      return false;
    }

    const teamInfo = LEAGUE_TEAMS[league]?.find(t => t.name === teamName);
    
    try {
      const { error } = await supabase
        .from('favorite_teams')
        .insert({
          user_id: user.id,
          team_name: teamName,
          league: league,
          espn_team_id: teamInfo?.espnId || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already added',
            description: `${teamName} is already in your favorites`,
          });
          return false;
        }
        throw error;
      }

      toast({
        title: 'Team added',
        description: `${teamName} added to your favorites`,
      });
      
      await fetchTeams();
      return true;
    } catch (err) {
      console.error('Error adding team:', err);
      toast({
        title: 'Error',
        description: 'Failed to add team',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeTeam = async (teamId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_teams')
        .delete()
        .eq('id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Team removed',
        description: 'Team removed from your favorites',
      });
      
      await fetchTeams();
      return true;
    } catch (err) {
      console.error('Error removing team:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove team',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    teams,
    isLoading,
    addTeam,
    removeTeam,
    refetch: fetchTeams,
  };
}
