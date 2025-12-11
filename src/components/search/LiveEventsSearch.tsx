import { ExternalLink, Calendar, Users, Tv, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveEvent } from '@/hooks/useLiveEventsSearch';

interface LiveEventsSearchProps {
  results: LiveEvent[];
  isLoading: boolean;
}

// Platform color mapping for visual distinction
const platformColors: Record<string, string> = {
  'ESPN': 'bg-red-600 text-white',
  'ESPN+': 'bg-red-700 text-white',
  'ABC': 'bg-blue-600 text-white',
  'Fox': 'bg-blue-500 text-white',
  'Fox Sports': 'bg-blue-500 text-white',
  'FS1': 'bg-blue-500 text-white',
  'CBS': 'bg-blue-800 text-white',
  'NBC': 'bg-purple-600 text-white',
  'Peacock': 'bg-gradient-to-r from-purple-500 to-yellow-400 text-white',
  'Prime Video': 'bg-cyan-600 text-white',
  'YouTube TV': 'bg-red-500 text-white',
  'NFL Network': 'bg-blue-900 text-white',
  'NBA TV': 'bg-orange-600 text-white',
  'MLB Network': 'bg-blue-700 text-white',
  'TNT': 'bg-red-800 text-white',
  'TBS': 'bg-blue-600 text-white',
  'USA Network': 'bg-blue-500 text-white',
  'Paramount+': 'bg-blue-700 text-white',
};

function getPlatformClass(platform: string): string {
  return platformColors[platform] || 'bg-muted text-foreground';
}

function StreamingPlatformBadges({ platforms }: { platforms?: string[] }) {
  if (!platforms || platforms.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Streaming platform unavailable — check local listings.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {platforms.map((platform, index) => (
        <Badge 
          key={`${platform}-${index}`}
          className={`${getPlatformClass(platform)} text-xs font-medium px-2 py-0.5`}
        >
          {platform}
        </Badge>
      ))}
    </div>
  );
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

        {/* Streaming Platforms */}
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-1.5">Watch on:</p>
          <StreamingPlatformBadges platforms={event.streamingPlatforms} />
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
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
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
