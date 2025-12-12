import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useFavoriteTeams, LEAGUE_TEAMS, SportLeague } from '@/hooks/useFavoriteTeams';
import { useLiveEventsSearch, LiveEvent } from '@/hooks/useLiveEventsSearch';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Plus, X, Calendar, Tv, Clock, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TeamEvent extends LiveEvent {
  teamName: string;
  eventDate?: string;
}

const LEAGUE_LABELS: Record<SportLeague, string> = {
  NFL: 'NFL',
  NBA: 'NBA',
  MLB: 'MLB',
  NHL: 'NHL',
  MLS: 'MLS',
  NCAAF: 'College Football',
  NCAAB: 'College Basketball',
};

export default function MyEvents() {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading, addTeam, removeTeam } = useFavoriteTeams();
  const [selectedLeague, setSelectedLeague] = useState<SportLeague>('NFL');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [upcomingEvents, setUpcomingEvents] = useState<TeamEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Fetch events for all favorite teams
  useEffect(() => {
    const fetchAllTeamEvents = async () => {
      if (teams.length === 0) {
        setUpcomingEvents([]);
        return;
      }

      setEventsLoading(true);
      const allEvents: TeamEvent[] = [];

      for (const team of teams) {
        try {
          const { data, error } = await supabase.functions.invoke('search-live-events', {
            body: { query: `${team.team_name} schedule` }
          });

          if (!error && data?.events) {
            const teamEvents = data.events.map((event: LiveEvent) => ({
              ...event,
              teamName: team.team_name,
            }));
            allEvents.push(...teamEvents);
          }
        } catch (err) {
          console.error(`Error fetching events for ${team.team_name}:`, err);
        }
      }

      // Sort by date
      allEvents.sort((a, b) => {
        const dateA = new Date(a.eventDate || a.time);
        const dateB = new Date(b.eventDate || b.time);
        return dateA.getTime() - dateB.getTime();
      });

      setUpcomingEvents(allEvents);
      setEventsLoading(false);
    };

    fetchAllTeamEvents();
  }, [teams]);

  const handleAddTeam = async () => {
    if (!selectedTeam) return;
    await addTeam(selectedTeam, selectedLeague);
    setSelectedTeam('');
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to track your favorite teams and never miss a game.
            </p>
            <Link to="/login">
              <Button className="bg-primary hover:bg-primary/90">Sign In</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">My Events</h1>
        </div>

        {/* Add Team Section */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5" />
              Add a Favorite Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={selectedLeague} onValueChange={(v) => {
                setSelectedLeague(v as SportLeague);
                setSelectedTeam('');
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAGUE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {LEAGUE_TEAMS[selectedLeague]?.map((team) => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAddTeam} 
                disabled={!selectedTeam}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Favorite Teams */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          {teamsLoading ? (
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-40" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-muted-foreground">
              No favorite teams yet. Add some teams above to see their upcoming events!
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {teams.map(team => (
                <Badge
                  key={team.id}
                  variant="secondary"
                  className="text-sm py-2 px-4 flex items-center gap-2"
                >
                  <span>{team.team_name}</span>
                  <span className="text-xs text-muted-foreground">({team.league})</span>
                  <button
                    onClick={() => removeTeam(team.id)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </h2>
          
          {eventsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {teams.length === 0 
                    ? 'Add your favorite teams to see their upcoming events here.'
                    : 'No upcoming events found for your favorite teams.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event, idx) => (
                <Card key={idx} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <Badge variant="outline" className="mb-3">{event.teamName}</Badge>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.eventName}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      
                      {event.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="line-clamp-1">{event.participants}</span>
                        </div>
                      )}
                      
                      {event.whereToWatch && event.whereToWatch !== 'TBD' && (
                        <div className="flex items-center gap-2">
                          <Tv className="w-4 h-4" />
                          <span>{event.whereToWatch}</span>
                        </div>
                      )}
                    </div>

                    {event.link && (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-sm"
                      >
                        More info <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
