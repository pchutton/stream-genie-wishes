import { useState, Component, ReactNode } from 'react';
import { ExternalLink, Calendar, Users, Tv, Radio, Check, LogIn, DollarSign, Heart, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { LiveEvent, PlatformInfo } from '@/hooks/useLiveEventsSearch';
import { NetworkLogo } from '@/components/media/NetworkLogos';
import { useSavedEvents } from '@/hooks/useSavedEvents';
import { cn } from '@/lib/utils';
import { ReportIssueDialog, ReportIssueButton } from '@/components/media/ReportIssueDialog';
import { formatDistanceToNow } from 'date-fns';

// Error boundary to catch rendering errors and prevent black screen
class EventCardErrorBoundary extends Component<{ children: ReactNode; eventName: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; eventName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EventCard render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to display: {this.props.eventName}
            </p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

interface LiveEventsSearchProps {
  results: LiveEvent[];
  isLoading: boolean;
  streamingDataLastUpdated?: string | null;
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
    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
      <NetworkLogo platform={platform.name} className="h-16 w-16" />
      <span className="text-sm font-medium truncate w-full text-center text-foreground">{platform.name}</span>
      {platform.status && (
        <span className={`text-xs px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 text-center leading-tight max-w-full ${style.bg} ${style.text}`}>
          {style.icon}
          <span className="break-words">{platform.status}</span>
        </span>
      )}
    </div>
  );

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-transform hover:scale-105 active:scale-95"
      title={`Open ${platform.name}`}
    >
      {content}
    </a>
  ) : content;
}

function StreamingPlatformBadges({ 
  platforms, 
  platformDetails,
  onReportClick 
}: { 
  platforms?: string[]; 
  platformDetails?: PlatformInfo[];
  onReportClick?: () => void;
}) {
  // Use platformDetails if available, otherwise generate default statuses for platform strings
  const items: PlatformInfo[] = (platformDetails && platformDetails.length > 0) 
    ? platformDetails 
    : (platforms || []).map(name => ({ name, status: getDefaultStatus(name) }));

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Streaming details TBD — check local listings.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Watch on:</p>
        {onReportClick && (
          <ReportIssueButton onClick={onReportClick} variant="text" />
        )}
      </div>
      <div className="flex overflow-x-auto gap-5 pb-3 pr-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.map((platform, idx) => (
          <div key={`${platform.name}-${idx}`} className="snap-start flex-shrink-0">
            <PlatformWithStatus platform={platform} />
          </div>
        ))}
      </div>
      {/* Subtle fade edge on right for scroll hint - only show if many items */}
      {items.length > 3 && (
        <div className="pointer-events-none absolute right-0 top-8 bottom-0 w-8 bg-gradient-to-l from-card to-transparent" />
      )}
    </div>
  );
}

// Default status based on platform type (matches backend logic)
function getDefaultStatus(platform: string): string {
  const name = platform.toLowerCase();
  
  // Live TV services
  if (['youtube tv', 'hulu + live tv', 'fubo', 'fubotv', 'directv stream', 'sling', 'sling orange', 'sling blue'].some(s => name.includes(s))) {
    return 'Included';
  }
  
  // Broadcast networks
  if (['espn', 'tnt', 'tbs', 'abc', 'cbs', 'nbc', 'fox', 'fs1', 'nfl network', 'nba tv', 'mlb network'].some(s => name === s || name.includes(s))) {
    return 'Live broadcast';
  }
  
  // Provider login apps
  if (name.includes('app')) {
    return 'Included with provider login';
  }
  
  // Subscription services
  if (name.includes('max')) return 'Included with Max subscription';
  if (name.includes('peacock')) return 'Included with Peacock subscription';
  if (name.includes('paramount')) return 'Included with Paramount+ subscription';
  if (name.includes('prime')) return 'Included with Prime Video subscription';
  if (name === 'espn+') return 'Included with ESPN+ subscription';
  
  return 'Included';
}

// Format event time in user's local timezone
function formatEventTimeLocal(event: LiveEvent): string {
  if (!event) return 'Time TBD';
  
  if (event.eventDateTimeUTC) {
    try {
      const date = new Date(event.eventDateTimeUTC);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
  }
  // Fallback to backend-provided time
  return event.time || 'Time TBD';
}

// Parse team IDs from participants for ESPN logos
function getTeamLogoUrl(teamName: string): string | null {
  // Map common team names to ESPN team IDs
  const teamIdMap: Record<string, { id: string; sport: string }> = {
    'Oklahoma Sooners': { id: '201', sport: 'ncaa' },
    'Alabama Crimson Tide': { id: '333', sport: 'ncaa' },
    'Georgia Bulldogs': { id: '61', sport: 'ncaa' },
    'Ohio State Buckeyes': { id: '194', sport: 'ncaa' },
    'Michigan Wolverines': { id: '130', sport: 'ncaa' },
    'Texas Longhorns': { id: '251', sport: 'ncaa' },
    'LSU Tigers': { id: '99', sport: 'ncaa' },
    'Penn State Nittany Lions': { id: '213', sport: 'ncaa' },
    'Notre Dame Fighting Irish': { id: '87', sport: 'ncaa' },
    'Tennessee Volunteers': { id: '2633', sport: 'ncaa' },
    'Oregon Ducks': { id: '2483', sport: 'ncaa' },
    'Clemson Tigers': { id: '228', sport: 'ncaa' },
    // NFL teams
    'Dallas Cowboys': { id: 'dal', sport: 'nfl' },
    'Kansas City Chiefs': { id: 'kc', sport: 'nfl' },
    'Philadelphia Eagles': { id: 'phi', sport: 'nfl' },
    'San Francisco 49ers': { id: 'sf', sport: 'nfl' },
    'Buffalo Bills': { id: 'buf', sport: 'nfl' },
    'Miami Dolphins': { id: 'mia', sport: 'nfl' },
    // NBA teams
    'Los Angeles Lakers': { id: 'lal', sport: 'nba' },
    'Golden State Warriors': { id: 'gs', sport: 'nba' },
    'Boston Celtics': { id: 'bos', sport: 'nba' },
    'Milwaukee Bucks': { id: 'mil', sport: 'nba' },
  };
  
  const team = teamIdMap[teamName];
  if (!team) return null;
  
  if (team.sport === 'ncaa') {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`;
  } else if (team.sport === 'nfl') {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`;
  } else if (team.sport === 'nba') {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${team.id}.png`;
  }
  return null;
}

function parseTeamsFromParticipants(participants: string): { home: string; away: string } | null {
  if (!participants) return null;
  
  // Try "Team A at Team B" or "Team A vs Team B" patterns
  const atMatch = participants.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) {
    return { away: atMatch[1].trim(), home: atMatch[2].trim() };
  }
  
  const vsMatch = participants.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i);
  if (vsMatch) {
    return { home: vsMatch[1].trim(), away: vsMatch[2].trim() };
  }
  
  return null;
}

function EventCard({ event, isSaved, onToggleSave }: { event: LiveEvent; isSaved: boolean; onToggleSave: () => void }) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  // Guard against null/undefined event
  if (!event || !event.eventName) {
    return null;
  }
  
  const localTime = formatEventTimeLocal(event);
  const teams = parseTeamsFromParticipants(event.participants || '');
  const homeLogoUrl = teams ? getTeamLogoUrl(teams.home) : null;
  const awayLogoUrl = teams ? getTeamLogoUrl(teams.away) : null;
  const showTeamLogos = homeLogoUrl || awayLogoUrl;
  
  // Get platform names for the report dialog - with null safety
  const platformNames = event.platformDetails?.map(p => p?.name).filter(Boolean) || event.streamingPlatforms || [];
  
  return (
    <>
      <Card className="bg-card border-border transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_25px_hsl(var(--genie-gold)/0.3),0_0_50px_hsl(var(--genie-gold)/0.1)] hover:-translate-y-1">
        <CardHeader className="pb-3">
          {/* Team logos row */}
          {showTeamLogos && teams && (
            <div className="flex items-center justify-center gap-5 mb-3">
              {awayLogoUrl ? (
                <img src={awayLogoUrl} alt={teams.away} className="h-14 w-14 object-contain" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <span className="text-base font-semibold text-muted-foreground">@</span>
              {homeLogoUrl ? (
                <img src={homeLogoUrl} alt={teams.home} className="h-14 w-14 object-contain" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 text-center">
            {event.eventName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-4">
          <div className="flex items-start gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{localTime}</span>
          </div>
          
          {event.participants && (
            <div className="flex items-start gap-2 text-sm">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{event.participants}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2 text-sm">
            <Tv className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground font-medium">
              {event.whereToWatch?.toUpperCase().includes('TBD') ? 'TV / streaming details TBD' : event.whereToWatch}
            </span>
          </div>

          {/* Streaming Platforms with Status */}
          <StreamingPlatformBadges 
            platforms={event.streamingPlatforms} 
            platformDetails={event.platformDetails}
            onReportClick={() => setReportDialogOpen(true)}
          />
          
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

          {/* Add to My Events Button */}
          <Button
            variant={isSaved ? "secondary" : "outline"}
            onClick={onToggleSave}
            className={cn(
              "w-full mt-2 h-10 gap-2 transition-all duration-300",
              isSaved 
                ? "" 
                : "border-primary/50 hover:bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
            )}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-all",
                isSaved 
                  ? "fill-primary text-primary" 
                  : "text-primary animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
              )} 
            />
            <span className={cn(isSaved ? "text-foreground" : "text-primary font-medium")}>
              {isSaved ? 'Saved to My Events' : 'Add to My Events'}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Report Issue Dialog */}
      <ReportIssueDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        contentType="live_event"
        contentId={event.eventName}
        contentTitle={event.eventName}
        providers={platformNames}
      />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center gap-4 mb-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4 overflow-hidden">
          <div className="flex flex-col items-center gap-2 w-24 shrink-0">
            <Skeleton className="h-14 w-14 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-2 w-24 shrink-0">
            <Skeleton className="h-14 w-14 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function LiveEventsSearch({ results, isLoading, streamingDataLastUpdated }: LiveEventsSearchProps) {
  const { isEventSaved, toggleSaveEvent } = useSavedEvents();
  
  // Ensure results is always an array to prevent .map() errors
  const safeResults = Array.isArray(results) ? results : [];

  // Format the last updated timestamp
  const getDataFreshnessInfo = () => {
    if (!streamingDataLastUpdated) return null;
    
    try {
      const date = new Date(streamingDataLastUpdated);
      const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
      const isStale = hoursAgo > 24 * 7; // More than 7 days old
      
      return {
        text: `Streaming data updated ${formatDistanceToNow(date, { addSuffix: true })}`,
        isStale,
      };
    } catch {
      return null;
    }
  };

  const freshnessInfo = getDataFreshnessInfo();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (safeResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Radio className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Search for live events, sports, or concerts
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try "Lakers game tonight" or "UFC this weekend"
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Try{' '}
          <Link to="/expanded-search" className="text-primary hover:underline font-medium">
            Expanded Search
          </Link>
          {' '}for concerts, international leagues, or any live event.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data freshness indicator */}
      {freshnessInfo && (
        <div className={cn(
          "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
          freshnessInfo.isStale 
            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          {freshnessInfo.isStale ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          <span>{freshnessInfo.text}</span>
          {freshnessInfo.isStale && (
            <span className="ml-1">— some info may be outdated. Report issues to help us update!</span>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeResults.map((event, index) => (
          <EventCardErrorBoundary key={`${event?.eventName || 'event'}-${index}`} eventName={event?.eventName || 'Unknown Event'}>
            <EventCard 
              event={event} 
              isSaved={isEventSaved(event?.eventName || '')}
              onToggleSave={() => toggleSaveEvent(event)}
            />
          </EventCardErrorBoundary>
        ))}
      </div>
    </div>
  );
}
