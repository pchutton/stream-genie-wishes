import { cn } from '@/lib/utils';
import { DollarSign, ShoppingCart } from 'lucide-react';

interface StreamingIconProps {
  platform: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'stream' | 'rent' | 'buy';
}

interface StreamingIconsProps {
  platforms: string[] | null;
  rentPlatforms?: string[] | null;
  buyPlatforms?: string[] | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Platform data with logos, colors, and URLs
const PLATFORM_DATA: Record<string, { 
  logo: string; 
  color: string; 
  url: string;
  shortName: string;
}> = {
  'netflix': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/netflix.webp',
    color: 'bg-[#E50914]',
    url: 'https://netflix.com',
    shortName: 'Netflix',
  },
  'hulu': {
    logo: 'https://images.justwatch.com/icon/116305230/s100/hulu.webp',
    color: 'bg-[#1CE783]',
    url: 'https://hulu.com',
    shortName: 'Hulu',
  },
  'amazon prime video': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime',
  },
  'prime video': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime',
  },
  'amazon video': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Amazon',
  },
  'disney+': {
    logo: 'https://images.justwatch.com/icon/147638351/s100/disneyplus.webp',
    color: 'bg-[#113CCF]',
    url: 'https://disneyplus.com',
    shortName: 'Disney+',
  },
  'disney plus': {
    logo: 'https://images.justwatch.com/icon/147638351/s100/disneyplus.webp',
    color: 'bg-[#113CCF]',
    url: 'https://disneyplus.com',
    shortName: 'Disney+',
  },
  'apple tv+': {
    logo: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'apple tv': {
    logo: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'apple tv amazon channel': {
    logo: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'hbo max': {
    logo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
    color: 'bg-[#002BE7]',
    url: 'https://max.com',
    shortName: 'Max',
  },
  'max': {
    logo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
    color: 'bg-[#002BE7]',
    url: 'https://max.com',
    shortName: 'Max',
  },
  'peacock': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/peacock.webp',
    color: 'bg-[#000000]',
    url: 'https://peacocktv.com',
    shortName: 'Peacock',
  },
  'peacock premium': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/peacock.webp',
    color: 'bg-[#000000]',
    url: 'https://peacocktv.com',
    shortName: 'Peacock',
  },
  'paramount+': {
    logo: 'https://images.justwatch.com/icon/232599720/s100/paramountplus.webp',
    color: 'bg-[#0064FF]',
    url: 'https://paramountplus.com',
    shortName: 'Paramount+',
  },
  'paramount plus': {
    logo: 'https://images.justwatch.com/icon/232599720/s100/paramountplus.webp',
    color: 'bg-[#0064FF]',
    url: 'https://paramountplus.com',
    shortName: 'Paramount+',
  },
  'crunchyroll': {
    logo: 'https://images.justwatch.com/icon/3209936/s100/crunchyroll.webp',
    color: 'bg-[#F47521]',
    url: 'https://crunchyroll.com',
    shortName: 'Crunchyroll',
  },
  'showtime': {
    logo: 'https://images.justwatch.com/icon/306329856/s100/showtime.webp',
    color: 'bg-[#FF0000]',
    url: 'https://showtime.com',
    shortName: 'Showtime',
  },
  'starz': {
    logo: 'https://images.justwatch.com/icon/14803/s100/starz.webp',
    color: 'bg-[#000000]',
    url: 'https://starz.com',
    shortName: 'Starz',
  },
  'tubi': {
    logo: 'https://images.justwatch.com/icon/169621959/s100/tubi.webp',
    color: 'bg-[#FA382F]',
    url: 'https://tubitv.com',
    shortName: 'Tubi',
  },
  'pluto tv': {
    logo: 'https://images.justwatch.com/icon/284099936/s100/plutotv.webp',
    color: 'bg-[#000000]',
    url: 'https://pluto.tv',
    shortName: 'Pluto TV',
  },
  'kanopy': {
    logo: 'https://images.justwatch.com/icon/59562423/s100/kanopy.webp',
    color: 'bg-[#8B5CF6]',
    url: 'https://kanopy.com',
    shortName: 'Kanopy',
  },
  'vudu': {
    logo: 'https://images.justwatch.com/icon/249324969/s100/vudu.webp',
    color: 'bg-[#3399FF]',
    url: 'https://vudu.com',
    shortName: 'Vudu',
  },
  'google play movies': {
    logo: 'https://images.justwatch.com/icon/169478387/s100/play.webp',
    color: 'bg-[#4285F4]',
    url: 'https://play.google.com/store/movies',
    shortName: 'Google Play',
  },
  'youtube': {
    logo: 'https://images.justwatch.com/icon/59562423/s100/youtube.webp',
    color: 'bg-[#FF0000]',
    url: 'https://youtube.com',
    shortName: 'YouTube',
  },
  'microsoft store': {
    logo: 'https://images.justwatch.com/icon/820542/s100/microsoftstore.webp',
    color: 'bg-[#0078D4]',
    url: 'https://microsoft.com/store',
    shortName: 'Microsoft',
  },
  'fandango at home': {
    logo: 'https://images.justwatch.com/icon/249324969/s100/vudu.webp',
    color: 'bg-[#FF6600]',
    url: 'https://fandangoathome.com',
    shortName: 'Fandango',
  },
  'amc+': {
    logo: 'https://images.justwatch.com/icon/280477442/s100/amcplus.webp',
    color: 'bg-[#0072CE]',
    url: 'https://amcplus.com',
    shortName: 'AMC+',
  },
  'amc': {
    logo: 'https://images.justwatch.com/icon/280477442/s100/amcplus.webp',
    color: 'bg-[#0072CE]',
    url: 'https://amcplus.com',
    shortName: 'AMC+',
  },
  'fubotv': {
    logo: 'https://images.justwatch.com/icon/147933285/s100/fubotv.webp',
    color: 'bg-[#FA4616]',
    url: 'https://fubo.tv',
    shortName: 'fuboTV',
  },
  'fubo tv': {
    logo: 'https://images.justwatch.com/icon/147933285/s100/fubotv.webp',
    color: 'bg-[#FA4616]',
    url: 'https://fubo.tv',
    shortName: 'fuboTV',
  },
  'youtube tv': {
    logo: 'https://images.justwatch.com/icon/158012148/s100/youtubetv.webp',
    color: 'bg-[#FF0000]',
    url: 'https://tv.youtube.com',
    shortName: 'YouTube TV',
  },
  'the roku channel': {
    logo: 'https://images.justwatch.com/icon/197109268/s100/therokuchannel.webp',
    color: 'bg-[#662D91]',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku',
  },
  'roku channel': {
    logo: 'https://images.justwatch.com/icon/197109268/s100/therokuchannel.webp',
    color: 'bg-[#662D91]',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku',
  },
  'philo': {
    logo: 'https://images.justwatch.com/icon/147038715/s100/philo.webp',
    color: 'bg-[#4C4CFF]',
    url: 'https://philo.com',
    shortName: 'Philo',
  },
  'spectrum on demand': {
    logo: 'https://images.justwatch.com/icon/169478387/s100/spectrum.webp',
    color: 'bg-[#0063B2]',
    url: 'https://spectrum.net',
    shortName: 'Spectrum',
  },
  'fx now': {
    logo: 'https://images.justwatch.com/icon/52449539/s100/fxnow.webp',
    color: 'bg-[#000000]',
    url: 'https://fxnetworks.com',
    shortName: 'FX',
  },
  'fxnow': {
    logo: 'https://images.justwatch.com/icon/52449539/s100/fxnow.webp',
    color: 'bg-[#000000]',
    url: 'https://fxnetworks.com',
    shortName: 'FX',
  },
  'mgm+': {
    logo: 'https://images.justwatch.com/icon/305237682/s100/mgmplus.webp',
    color: 'bg-[#BC9458]',
    url: 'https://mgmplus.com',
    shortName: 'MGM+',
  },
  'mgm plus': {
    logo: 'https://images.justwatch.com/icon/305237682/s100/mgmplus.webp',
    color: 'bg-[#BC9458]',
    url: 'https://mgmplus.com',
    shortName: 'MGM+',
  },
  'sling tv': {
    logo: 'https://images.justwatch.com/icon/169478387/s100/slingtv.webp',
    color: 'bg-[#0074E4]',
    url: 'https://sling.com',
    shortName: 'Sling',
  },
  'britbox': {
    logo: 'https://images.justwatch.com/icon/158012148/s100/britbox.webp',
    color: 'bg-[#D6001C]',
    url: 'https://britbox.com',
    shortName: 'BritBox',
  },
  'mubi': {
    logo: 'https://images.justwatch.com/icon/147983397/s100/mubi.webp',
    color: 'bg-[#001324]',
    url: 'https://mubi.com',
    shortName: 'MUBI',
  },
  'shudder': {
    logo: 'https://images.justwatch.com/icon/116305549/s100/shudder.webp',
    color: 'bg-[#000000]',
    url: 'https://shudder.com',
    shortName: 'Shudder',
  },
};

const SIZE_CLASSES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

function normalizeplatformName(platform: string): string {
  return platform.toLowerCase().trim();
}

export function StreamingIcon({ platform, onClick, size = 'md', type = 'stream' }: StreamingIconProps) {
  const normalized = normalizeplatformName(platform);
  const data = PLATFORM_DATA[normalized];
  
  const handleClick = () => {
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
    onClick?.();
  };

  const typeIndicator = type === 'rent' ? (
    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white" title="Rent">
      <DollarSign className="h-2.5 w-2.5" />
    </div>
  ) : type === 'buy' ? (
    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white" title="Buy">
      <ShoppingCart className="h-2.5 w-2.5" />
    </div>
  ) : null;

  // If we have logo data, show the logo
  if (data) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'group/icon relative flex items-center justify-center rounded-lg overflow-hidden transition-all hover:scale-110 hover:ring-2 hover:ring-primary/50',
          SIZE_CLASSES[size]
        )}
        title={`${type === 'rent' ? 'Rent on' : type === 'buy' ? 'Buy on' : 'Watch on'} ${data.shortName}`}
      >
        <img 
          src={data.logo} 
          alt={data.shortName}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {typeIndicator}
      </button>
    );
  }

  // Fallback for unknown platforms
  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-muted text-[10px] font-medium text-muted-foreground transition-all hover:scale-110 hover:bg-muted/80',
        SIZE_CLASSES[size]
      )}
      title={`${type === 'rent' ? 'Rent on' : type === 'buy' ? 'Buy on' : 'Watch on'} ${platform}`}
    >
      {platform.slice(0, 2).toUpperCase()}
      {typeIndicator}
    </button>
  );
}

export function StreamingIcons({ platforms, rentPlatforms, buyPlatforms, size = 'md' }: StreamingIconsProps) {
  const hasStreaming = platforms && platforms.length > 0;
  const hasRent = rentPlatforms && rentPlatforms.length > 0;
  const hasBuy = buyPlatforms && buyPlatforms.length > 0;

  if (!hasStreaming && !hasRent && !hasBuy) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <span className="italic">Not available</span>
      </div>
    );
  }

  // Deduplicate platforms
  const getUniquePlatforms = (platformList: string[]) => {
    const seen = new Set<string>();
    return platformList.filter(p => {
      const normalized = normalizeplatformName(p);
      const data = PLATFORM_DATA[normalized];
      const key = data?.shortName || p;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
  };

  const uniqueStreaming = hasStreaming ? getUniquePlatforms(platforms) : [];
  const uniqueRent = hasRent ? getUniquePlatforms(rentPlatforms) : [];
  const uniqueBuy = hasBuy ? getUniquePlatforms(buyPlatforms) : [];

  return (
    <div className="grid grid-cols-3 gap-1">
      {/* Streaming platforms */}
      {uniqueStreaming.slice(0, 4).map((platform) => (
        <StreamingIcon 
          key={`stream-${platform}`} 
          platform={platform} 
          size={size}
          type="stream"
        />
      ))}
      
      {/* Rent platforms (only show if not already in streaming) */}
      {uniqueRent
        .filter(p => !uniqueStreaming.some(s => {
          const sData = PLATFORM_DATA[normalizeplatformName(s)];
          const pData = PLATFORM_DATA[normalizeplatformName(p)];
          return (sData?.shortName || s) === (pData?.shortName || p);
        }))
        .slice(0, 2)
        .map((platform) => (
          <StreamingIcon 
            key={`rent-${platform}`} 
            platform={platform} 
            size={size}
            type="rent"
          />
        ))}
      
      {/* Buy platforms (only show if not in streaming or rent) */}
      {uniqueBuy
        .filter(p => {
          const pData = PLATFORM_DATA[normalizeplatformName(p)];
          const pName = pData?.shortName || p;
          const inStreaming = uniqueStreaming.some(s => {
            const sData = PLATFORM_DATA[normalizeplatformName(s)];
            return (sData?.shortName || s) === pName;
          });
          const inRent = uniqueRent.some(r => {
            const rData = PLATFORM_DATA[normalizeplatformName(r)];
            return (rData?.shortName || r) === pName;
          });
          return !inStreaming && !inRent;
        })
        .slice(0, 2)
        .map((platform) => (
          <StreamingIcon 
            key={`buy-${platform}`} 
            platform={platform} 
            size={size}
            type="buy"
          />
        ))}
    </div>
  );
}
