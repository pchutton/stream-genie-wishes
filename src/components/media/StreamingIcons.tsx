import { cn } from '@/lib/utils';
import { DollarSign, ShoppingCart } from 'lucide-react';
import { hapticLight } from '@/hooks/useDespia';
import primeVideoLogo from '@/assets/logos/prime-video.png';
import peacockLogo from '@/assets/logos/peacock.png';
import paramountPlusLogo from '@/assets/logos/paramount-plus.png';
import maxLogo from '@/assets/logos/max.png';
import huluLogo from '@/assets/logos/hulu.png';
import fubotvLogo from '@/assets/logos/fubotv.png';
import youtubeTvLogo from '@/assets/logos/youtube-tv.png';
import slingLogo from '@/assets/logos/sling.png';
import espnLogo from '@/assets/logos/espn.png';
import espnPlusLogo from '@/assets/logos/espn-plus.png';

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
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg',
    color: 'bg-[#E50914]',
    url: 'https://netflix.com',
    shortName: 'Netflix',
  },
  'hulu': {
    logo: huluLogo,
    color: 'bg-[#1CE783]',
    url: 'https://hulu.com',
    shortName: 'Hulu',
  },
  'amazon prime video': {
    logo: primeVideoLogo,
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime',
  },
  'prime video': {
    logo: primeVideoLogo,
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime',
  },
  'amazon video': {
    logo: primeVideoLogo,
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Amazon',
  },
  'disney+': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg',
    color: 'bg-[#113CCF]',
    url: 'https://disneyplus.com',
    shortName: 'Disney+',
  },
  'disney plus': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg',
    color: 'bg-[#113CCF]',
    url: 'https://disneyplus.com',
    shortName: 'Disney+',
  },
  'apple tv+': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'apple tv': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'apple tv amazon channel': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: 'bg-[#000000]',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+',
  },
  'hbo max': {
    logo: maxLogo,
    color: 'bg-[#002BE7]',
    url: 'https://max.com',
    shortName: 'Max',
  },
  'max': {
    logo: maxLogo,
    color: 'bg-[#002BE7]',
    url: 'https://max.com',
    shortName: 'Max',
  },
  'peacock': {
    logo: peacockLogo,
    color: 'bg-[#000000]',
    url: 'https://peacocktv.com',
    shortName: 'Peacock',
  },
  'peacock premium': {
    logo: peacockLogo,
    color: 'bg-[#000000]',
    url: 'https://peacocktv.com',
    shortName: 'Peacock',
  },
  'paramount+': {
    logo: paramountPlusLogo,
    color: 'bg-[#0064FF]',
    url: 'https://paramountplus.com',
    shortName: 'Paramount+',
  },
  'paramount plus': {
    logo: paramountPlusLogo,
    color: 'bg-[#0064FF]',
    url: 'https://paramountplus.com',
    shortName: 'Paramount+',
  },
  'crunchyroll': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/crunchyroll.svg',
    color: 'bg-[#F47521]',
    url: 'https://crunchyroll.com',
    shortName: 'Crunchyroll',
  },
  'showtime': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Showtime.svg',
    color: 'bg-[#FF0000]',
    url: 'https://showtime.com',
    shortName: 'Showtime',
  },
  'starz': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Starz_2016.svg',
    color: 'bg-[#000000]',
    url: 'https://starz.com',
    shortName: 'Starz',
  },
  'tubi': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tubi.svg',
    color: 'bg-[#FA382F]',
    url: 'https://tubitv.com',
    shortName: 'Tubi',
  },
  'pluto tv': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/plutotv.svg',
    color: 'bg-[#000000]',
    url: 'https://pluto.tv',
    shortName: 'Pluto TV',
  },
  'kanopy': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Kanopy_logo.svg',
    color: 'bg-[#8B5CF6]',
    url: 'https://kanopy.com',
    shortName: 'Kanopy',
  },
  'vudu': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Vudu_2014_logo.svg',
    color: 'bg-[#3399FF]',
    url: 'https://vudu.com',
    shortName: 'Vudu',
  },
  'google play movies': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googleplay.svg',
    color: 'bg-[#4285F4]',
    url: 'https://play.google.com/store/movies',
    shortName: 'Google Play',
  },
  'youtube': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
    color: 'bg-[#FF0000]',
    url: 'https://youtube.com',
    shortName: 'YouTube',
  },
  'microsoft store': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoft.svg',
    color: 'bg-[#0078D4]',
    url: 'https://microsoft.com/store',
    shortName: 'Microsoft',
  },
  'fandango at home': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Fandango_at_Home_logo.svg',
    color: 'bg-[#FF6600]',
    url: 'https://fandangoathome.com',
    shortName: 'Fandango',
  },
  'fandango at home free': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Fandango_at_Home_logo.svg',
    color: 'bg-[#FF6600]',
    url: 'https://fandangoathome.com',
    shortName: 'Fandango Free',
  },
  'amc+': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Amc_plus.svg',
    color: 'bg-[#0072CE]',
    url: 'https://amcplus.com',
    shortName: 'AMC+',
  },
  'amc': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Amc_plus.svg',
    color: 'bg-[#0072CE]',
    url: 'https://amcplus.com',
    shortName: 'AMC+',
  },
  'fubotv': {
    logo: fubotvLogo,
    color: 'bg-[#FA4616]',
    url: 'https://fubo.tv',
    shortName: 'fuboTV',
  },
  'fubo tv': {
    logo: fubotvLogo,
    color: 'bg-[#FA4616]',
    url: 'https://fubo.tv',
    shortName: 'fuboTV',
  },
  'youtube tv': {
    logo: youtubeTvLogo,
    color: 'bg-[#FF0000]',
    url: 'https://tv.youtube.com',
    shortName: 'YouTube TV',
  },
  'sling tv': {
    logo: slingLogo,
    color: 'bg-[#0074E4]',
    url: 'https://sling.com',
    shortName: 'Sling',
  },
  'sling': {
    logo: slingLogo,
    color: 'bg-[#0074E4]',
    url: 'https://sling.com',
    shortName: 'Sling',
  },
  'espn': {
    logo: espnLogo,
    color: 'bg-[#CC0000]',
    url: 'https://espn.com/watch',
    shortName: 'ESPN',
  },
  'espn+': {
    logo: espnPlusLogo,
    color: 'bg-[#CC0000]',
    url: 'https://plus.espn.com',
    shortName: 'ESPN+',
  },
  'espn plus': {
    logo: espnPlusLogo,
    color: 'bg-[#CC0000]',
    url: 'https://plus.espn.com',
    shortName: 'ESPN+',
  },
  'the roku channel': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roku.svg',
    color: 'bg-[#662D91]',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku',
  },
  'roku channel': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roku.svg',
    color: 'bg-[#662D91]',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku',
  },
  'philo': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Philo_logo.svg',
    color: 'bg-[#4C4CFF]',
    url: 'https://philo.com',
    shortName: 'Philo',
  },
  'spectrum on demand': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Spectrum_logo.svg',
    color: 'bg-[#0063B2]',
    url: 'https://spectrum.net',
    shortName: 'Spectrum',
  },
  'fx now': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/FX_International_logo.svg',
    color: 'bg-[#000000]',
    url: 'https://fxnetworks.com',
    shortName: 'FX',
  },
  'fxnow': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/FX_International_logo.svg',
    color: 'bg-[#000000]',
    url: 'https://fxnetworks.com',
    shortName: 'FX',
  },
  'mgm+': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/MGM%2B_logo.svg',
    color: 'bg-[#BC9458]',
    url: 'https://mgmplus.com',
    shortName: 'MGM+',
  },
  'mgm plus': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/MGM%2B_logo.svg',
    color: 'bg-[#BC9458]',
    url: 'https://mgmplus.com',
    shortName: 'MGM+',
  },
  'britbox': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/47/BritBox_logo.svg',
    color: 'bg-[#D6001C]',
    url: 'https://britbox.com',
    shortName: 'BritBox',
  },
  'mubi': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Mubi_logo.svg',
    color: 'bg-[#001324]',
    url: 'https://mubi.com',
    shortName: 'MUBI',
  },
  'shudder': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Shudder_logo.svg',
    color: 'bg-[#000000]',
    url: 'https://shudder.com',
    shortName: 'Shudder',
  },
  'hoopla': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Hoopla_logo.svg',
    color: 'bg-[#E31837]',
    url: 'https://hoopladigital.com',
    shortName: 'Hoopla',
  },
  'plex': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/plex.svg',
    color: 'bg-[#E5A00D]',
    url: 'https://plex.tv',
    shortName: 'Plex',
  },
  'fawesome': {
    logo: 'https://fawesome.tv/favicon.ico',
    color: 'bg-[#FF6B00]',
    url: 'https://fawesome.tv',
    shortName: 'Fawesome',
  },
  'amazon prime video with ads': {
    logo: primeVideoLogo,
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime (Ads)',
  },
  'prime video with ads': {
    logo: primeVideoLogo,
    color: 'bg-[#00A8E1]',
    url: 'https://primevideo.com',
    shortName: 'Prime (Ads)',
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
    hapticLight();
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

  // Show max 3 streaming icons total in a single row
  return (
    <div className="grid grid-cols-3 gap-2">
      {uniqueStreaming.slice(0, 3).map((platform) => (
        <StreamingIcon 
          key={`stream-${platform}`} 
          platform={platform} 
          size={size}
          type="stream"
        />
      ))}
      
      {/* Fill remaining slots with rent/buy if less than 3 streaming */}
      {uniqueStreaming.length < 3 && uniqueRent
        .filter(p => !uniqueStreaming.some(s => {
          const sData = PLATFORM_DATA[normalizeplatformName(s)];
          const pData = PLATFORM_DATA[normalizeplatformName(p)];
          return (sData?.shortName || s) === (pData?.shortName || p);
        }))
        .slice(0, 3 - uniqueStreaming.length)
        .map((platform) => (
          <StreamingIcon 
            key={`rent-${platform}`} 
            platform={platform} 
            size={size}
            type="rent"
          />
        ))}
    </div>
  );
}
