import { ExternalLink, Calendar, Users, Tv, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveEvent } from '@/hooks/useLiveEventsSearch';

interface LiveEventsSearchProps {
  results: LiveEvent[];
  isLoading: boolean;
}

function EventCard({ event }: { event: LiveEvent }) {
  return (
    <Card className="bg-card border-border transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_25px_hsl(var(--genie-gold)/0.3),0_0_50px_hsl(var(--genie-gold)/0.1)] hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
          {event.eventName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{event.time}</span>
        </div>
        
        {event.participants && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{event.participants}</span>
          </div>
        )}
        
        <div className="flex items-start gap-2 text-sm">
          <Tv className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span className="text-foreground font-medium">{event.whereToWatch}</span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.summary}
        </p>
        
        {event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full mt-2 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            More Info
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function LiveEventsSearch({ results, isLoading }: LiveEventsSearchProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Radio className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Search for live events, sports, or concerts
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try "Lakers game tonight" or "UFC this weekend"
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map((event, index) => (
        <EventCard key={`${event.eventName}-${index}`} event={event} />
      ))}
    </div>
  );
}
