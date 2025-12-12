import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useFavoriteTeams, LEAGUE_TEAMS, SportLeague } from '@/hooks/useFavoriteTeams';
import { useLiveEventsSearch, LiveEvent } from '@/hooks/useLiveEventsSearch';
import { useSavedEvents, SavedEvent } from '@/hooks/useSavedEvents';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Plus, X, Calendar, Tv, Clock, Users, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { NetworkLogo } from '@/components/media/NetworkLogos';

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
  const { savedEvents, isLoading: savedEventsLoading, unsaveEvent } = useSavedEvents();
  const [selectedLeague, setSelectedLeague] = useState<SportLeague>('NFL');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Fetch events for all favorite teams with caching
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['team-events', teams.map(t => t.team_name).join(',')],
    queryFn: async () => {
      if (teams.length === 0) return [];

      const allEvents: TeamEvent[] = [];

      // Fetch all teams in parallel for better performance
      const results = await Promise.allSettled(
        teams.map(async (team) => {
          const { data, error } = await supabase.functions.invoke('search-live-events', {
            body: { query: `${team.team_name} schedule` }
          });

          if (!error && data?.events) {
            return data.events.map((event: LiveEvent) => ({
              ...event,
              teamName: team.team_name,
            }));
          }
          return [];
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allEvents.push(...result.value);
        }
      });

      // Sort by date
      allEvents.sort((a, b) => {
        const dateA = new Date(a.eventDate || a.time);
        const dateB = new Date(b.eventDate || b.time);
        return dateA.getTime() - dateB.getTime();
      });

      return allEvents;
    },
    enabled: teams.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

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

        {/* Notification Settings */}
        <div className="mb-8">
          <NotificationSettings />
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

        {/* Saved Events from Search */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Saved Events
          </h2>
          
          {savedEventsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : savedEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No saved events yet. Search for live events and click the heart icon to save them here.
                </p>
                <Link to="/">
                  <Button variant="outline" className="mt-4">
                    Search Events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedEvents.map((event) => (
                <Card key={event.id} className="hover:border-primary/50 transition-colors group">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 flex-1">{event.event_name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unsaveEvent(event.event_name)}
                        className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from My Events"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.event_time}</span>
                      </div>
                      
                      {event.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="line-clamp-1">{event.participants}</span>
                        </div>
                      )}
                      
                      {event.where_to_watch && event.where_to_watch !== 'TBD' && (
                        <div className="flex items-center gap-2">
                          <Tv className="w-4 h-4" />
                          <span>{event.where_to_watch}</span>
                        </div>
                      )}
                    </div>

                    {/* Streaming Platform Logos */}
                    {event.platform_details && event.platform_details.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Watch on:</p>
                        <div className="flex flex-wrap gap-2">
                          {event.platform_details.map((platform, idx) => (
                            <NetworkLogo 
                              key={`${platform.name}-${idx}`}
                              platform={platform.name}
                              className="h-7"
                            />
                          ))}
                        </div>
                      </div>
                    )}

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

        {/* Upcoming Events from Favorite Teams */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events (from Favorite Teams)
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
