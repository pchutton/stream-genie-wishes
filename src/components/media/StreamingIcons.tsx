import { cn } from '@/lib/utils';

interface StreamingIconProps {
  platform: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface StreamingIconsProps {
  platforms: string[] | null;
  size?: 'sm' | 'md' | 'lg';
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
};

const SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

function normalizeplatformName(platform: string): string {
  return platform.toLowerCase().trim();
}

export function StreamingIcon({ platform, onClick, size = 'md' }: StreamingIconProps) {
  const normalized = normalizeplatformName(platform);
  const data = PLATFORM_DATA[normalized];
  
  const handleClick = () => {
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
    onClick?.();
  };

  // If we have logo data, show the logo
  if (data) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'group/icon relative flex items-center justify-center rounded-lg overflow-hidden transition-all hover:scale-110 hover:ring-2 hover:ring-primary/50',
          SIZE_CLASSES[size]
        )}
        title={`Watch on ${data.shortName}`}
      >
        <img 
          src={data.logo} 
          alt={data.shortName}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to text if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </button>
    );
  }

  // Fallback for unknown platforms
  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-lg bg-muted text-[10px] font-medium text-muted-foreground transition-all hover:scale-110 hover:bg-muted/80',
        SIZE_CLASSES[size]
      )}
      title={platform}
    >
      {platform.slice(0, 2).toUpperCase()}
    </button>
  );
}

export function StreamingIcons({ platforms, size = 'md' }: StreamingIconsProps) {
  if (!platforms || platforms.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <span className="italic">Not streaming</span>
      </div>
    );
  }

  // Deduplicate platforms (e.g., "Apple TV" and "Apple TV Amazon Channel" are the same)
  const uniquePlatforms = Array.from(new Set(
    platforms.map(p => {
      const normalized = normalizeplatformName(p);
      const data = PLATFORM_DATA[normalized];
      return data?.shortName || p;
    })
  )).slice(0, 4); // Show max 4 platforms

  return (
    <div className="flex flex-col items-center gap-2">
      {uniquePlatforms.map((platform) => {
        // Find the original platform name that matches this shortName
        const originalPlatform = platforms.find(p => {
          const normalized = normalizeplatformName(p);
          const data = PLATFORM_DATA[normalized];
          return (data?.shortName || p) === platform;
        }) || platform;
        
        return (
          <StreamingIcon 
            key={platform} 
            platform={originalPlatform} 
            size={size} 
          />
        );
      })}
    </div>
  );
}
