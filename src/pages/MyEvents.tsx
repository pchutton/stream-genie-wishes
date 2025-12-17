import { Layout } from '@/components/layout/Layout';
import { useSavedEvents } from '@/hooks/useSavedEvents';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Tv, Clock, Users, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { NetworkLogo } from '@/components/media/NetworkLogos';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyEvents() {
  const { user } = useAuth();
  const { savedEvents, isLoading: savedEventsLoading, unsaveEvent } = useSavedEvents();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to save your favorite live events.
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

        {/* Saved Events from Search */}
        <div>
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
      </div>
    </Layout>
  );
}
