import { ExternalLink, Calendar, Users, Tv, Radio, Check, LogIn, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveEvent, PlatformInfo } from '@/hooks/useLiveEventsSearch';
import { NetworkLogo } from '@/components/media/NetworkLogos';

interface LiveEventsSearchProps {
  results: LiveEvent[];
  isLoading: boolean;
}

// Streaming platform URLs
const platformUrls: Record<string, string> = {
  'youtube tv': 'https://tv.youtube.com',
  'hulu': 'https://www.hulu.com',
  'hulu + live tv': 'https://www.hulu.com/live-tv',
  'fubo': 'https://www.fubo.tv',
  'fubotv': 'https://www.fubo.tv',
  'directv stream': 'https://www.directv.com/stream',
  'sling': 'https://www.sling.com',
  'sling orange': 'https://www.sling.com',
  'sling blue': 'https://www.sling.com',
  'espn': 'https://www.espn.com/watch',
  'espn2': 'https://www.espn.com/watch',
  'espn+': 'https://plus.espn.com',
  'espn app': 'https://www.espn.com/watch',
  'abc': 'https://abc.com/watch-live',
  'cbs': 'https://www.cbs.com',
  'nbc': 'https://www.nbc.com',
  'fox': 'https://www.fox.com',
  'fs1': 'https://www.foxsports.com',
  'fox sports': 'https://www.foxsports.com',
  'peacock': 'https://www.peacocktv.com',
  'paramount+': 'https://www.paramountplus.com',
  'prime video': 'https://www.amazon.com/primevideo',
  'amazon prime video': 'https://www.amazon.com/primevideo',
  'amazon prime': 'https://www.amazon.com/primevideo',
  'max': 'https://www.max.com',
  'hbo max': 'https://www.max.com',
  'tnt': 'https://www.tntdrama.com',
  'tbs': 'https://www.tbs.com',
  'nfl network': 'https://www.nfl.com/network',
  'nba tv': 'https://www.nba.com/watch',
  'mlb network': 'https://www.mlb.com/network',
  'usa network': 'https://www.usanetwork.com',
  'usa': 'https://www.usanetwork.com',
};

function getPlatformUrl(platform: string): string | null {
  return platformUrls[platform.toLowerCase()] || null;
}

// Get the status badge styling based on the status text
function getStatusBadgeStyle(status: string): { bg: string; text: string; icon: React.ReactNode } {
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'included' || statusLower === 'live broadcast') {
    return {
      bg: 'bg-green-500/20 border-green-500/30',
      text: 'text-green-400',
      icon: <Check className="h-3 w-3" />
    };
  }
  
  if (statusLower.includes('provider login') || statusLower.includes('with login')) {
    return {
      bg: 'bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-400',
      icon: <LogIn className="h-3 w-3" />
    };
  }
  
  if (statusLower.includes('subscription')) {
    return {
      bg: 'bg-purple-500/20 border-purple-500/30',
      text: 'text-purple-400',
      icon: <Check className="h-3 w-3" />
    };
  }
  
  if (statusLower.includes('rent') || statusLower.includes('ppv') || statusLower.includes('$')) {
    return {
      bg: 'bg-orange-500/20 border-orange-500/30',
      text: 'text-orange-400',
      icon: <DollarSign className="h-3 w-3" />
    };
  }
  
  // Default/unknown
  return {
    bg: 'bg-muted/50 border-muted-foreground/20',
    text: 'text-muted-foreground',
    icon: null
  };
}

function PlatformWithStatus({ platform }: { platform: PlatformInfo }) {
  const style = getStatusBadgeStyle(platform.status);
  const url = getPlatformUrl(platform.name);
  
  const content = (
    <div className="flex flex-col items-center gap-1">
      <NetworkLogo platform={platform.name} className="h-9" />
      <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${style.bg} ${style.text}`}>
        {style.icon}
        <span className="truncate max-w-[80px]">{platform.status}</span>
      </span>
    </div>
  );
  
  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="transition-transform hover:scale-105 hover:opacity-80"
        title={`Open ${platform.name}`}
      >
        {content}
      </a>
    );
  }
  
  return content;
}

function StreamingPlatformBadges({ platforms, platformDetails }: { platforms?: string[]; platformDetails?: PlatformInfo[] }) {
  // If we have detailed platform info with status, use that
  if (platformDetails && platformDetails.length > 0) {
    return (
      <div className="flex flex-wrap gap-3 items-start">
        {platformDetails.map((platform, index) => (
          <PlatformWithStatus 
            key={`${platform.name}-${index}`}
            platform={platform}
          />
        ))}
      </div>
    );
  }
  
  // Fallback to just logos if no details available
  if (!platforms || platforms.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Streaming platform unavailable — check local listings.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {platforms.map((platform, index) => {
        const url = getPlatformUrl(platform);
        const logo = (
          <NetworkLogo 
            key={`${platform}-${index}`}
            platform={platform}
            className="h-9"
          />
        );
        
        if (url) {
          return (
            <a 
              key={`${platform}-${index}`}
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105 hover:opacity-80"
              title={`Open ${platform}`}
            >
              {logo}
            </a>
          );
        }
        
        return logo;
      })}
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

        {/* Streaming Platforms with Status */}
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-2">Watch on:</p>
          <StreamingPlatformBadges 
            platforms={event.streamingPlatforms} 
            platformDetails={event.platformDetails}
          />
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
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
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
