import { cn } from '@/lib/utils';
import { hapticLight } from '@/hooks/useDespia';
import fubotvLogo from '@/assets/logos/fubotv.png';
import youtubeTvLogo from '@/assets/logos/youtube-tv.png';
import fxLogo from '@/assets/logos/fx.png';
import primeVideoLogo from '@/assets/logos/prime-video.png';
import peacockLogo from '@/assets/logos/peacock.png';
import paramountPlusLogo from '@/assets/logos/paramount-plus.png';
import maxLogo from '@/assets/logos/max.png';
import huluLogo from '@/assets/logos/hulu.png';
import slingLogo from '@/assets/logos/sling.png';

interface StreamingBadgesProps {
  platforms: string[] | null;
  rentPlatforms?: string[] | null;
  buyPlatforms?: string[] | null;
}

const PLATFORM_DATA: Record<string, { logo: string; color: string; url: string; shortName: string }> = {
  'netflix': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg',
    color: '#E50914',
    url: 'https://www.netflix.com',
    shortName: 'Netflix'
  },
  'disney plus': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg',
    color: '#113CCF',
    url: 'https://www.disneyplus.com',
    shortName: 'Disney+'
  },
  'disney+': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg',
    color: '#113CCF',
    url: 'https://www.disneyplus.com',
    shortName: 'Disney+'
  },
  'hulu': {
    logo: huluLogo,
    color: '#1CE783',
    url: 'https://www.hulu.com',
    shortName: 'Hulu'
  },
  'amazon prime video': {
    logo: primeVideoLogo,
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime'
  },
  'prime video': {
    logo: primeVideoLogo,
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime'
  },
  'amazon video': {
    logo: primeVideoLogo,
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Amazon'
  },
  'apple tv plus': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: '#000000',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+'
  },
  'apple tv': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: '#000000',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV'
  },
  'apple tv+': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/appletv.svg',
    color: '#000000',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+'
  },
  'max': {
    logo: maxLogo,
    color: '#002BE7',
    url: 'https://www.max.com',
    shortName: 'Max'
  },
  'hbo max': {
    logo: maxLogo,
    color: '#002BE7',
    url: 'https://www.max.com',
    shortName: 'Max'
  },
  'paramount plus': {
    logo: paramountPlusLogo,
    color: '#0064FF',
    url: 'https://www.paramountplus.com',
    shortName: 'Paramount+'
  },
  'paramount+': {
    logo: paramountPlusLogo,
    color: '#0064FF',
    url: 'https://www.paramountplus.com',
    shortName: 'Paramount+'
  },
  'peacock': {
    logo: peacockLogo,
    color: '#000000',
    url: 'https://www.peacocktv.com',
    shortName: 'Peacock'
  },
  'peacock premium': {
    logo: peacockLogo,
    color: '#000000',
    url: 'https://www.peacocktv.com',
    shortName: 'Peacock'
  },
  'youtube': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
    color: '#FF0000',
    url: 'https://www.youtube.com',
    shortName: 'YouTube'
  },
  'google play movies': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googleplay.svg',
    color: '#4285F4',
    url: 'https://play.google.com/store/movies',
    shortName: 'Google Play'
  },
  'vudu': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Vudu_2014_logo.svg',
    color: '#3399FF',
    url: 'https://www.vudu.com',
    shortName: 'Vudu'
  },
  'fubotv': {
    logo: fubotvLogo,
    color: '#FF6B00',
    url: 'https://www.fubo.tv',
    shortName: 'FuboTV'
  },
  'fubo tv': {
    logo: fubotvLogo,
    color: '#FF6B00',
    url: 'https://www.fubo.tv',
    shortName: 'FuboTV'
  },
  'youtube tv': {
    logo: youtubeTvLogo,
    color: '#FF0000',
    url: 'https://tv.youtube.com',
    shortName: 'YouTube TV'
  },
  'fx': {
    logo: fxLogo,
    color: '#000000',
    url: 'https://www.fxnetworks.com',
    shortName: 'FX'
  },
  'fxnow': {
    logo: fxLogo,
    color: '#000000',
    url: 'https://www.fxnetworks.com',
    shortName: 'FX'
  },
  'fx now': {
    logo: fxLogo,
    color: '#000000',
    url: 'https://www.fxnetworks.com',
    shortName: 'FX'
  },
  'tubi': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tubi.svg',
    color: '#FA382F',
    url: 'https://tubitv.com',
    shortName: 'Tubi'
  },
  'amazon prime video with ads': {
    logo: primeVideoLogo,
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime (Ads)'
  },
  'prime video with ads': {
    logo: primeVideoLogo,
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime (Ads)'
  },
  'kanopy': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Kanopy_logo.svg',
    color: '#8B5CF6',
    url: 'https://www.kanopy.com',
    shortName: 'Kanopy'
  },
  'hoopla': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Hoopla_logo.svg',
    color: '#E31837',
    url: 'https://www.hoopladigital.com',
    shortName: 'Hoopla'
  },
  'plex': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/plex.svg',
    color: '#E5A00D',
    url: 'https://www.plex.tv',
    shortName: 'Plex'
  },
  'fawesome': {
    logo: 'https://fawesome.tv/favicon.ico',
    color: '#FF6B00',
    url: 'https://fawesome.tv',
    shortName: 'Fawesome'
  },
  'fandango at home': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Fandango_at_Home_logo.svg',
    color: '#FF6600',
    url: 'https://www.fandangoathome.com',
    shortName: 'Fandango'
  },
  'fandango at home free': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Fandango_at_Home_logo.svg',
    color: '#FF6600',
    url: 'https://www.fandangoathome.com',
    shortName: 'Fandango Free'
  },
  'pluto tv': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/plutotv.svg',
    color: '#000000',
    url: 'https://pluto.tv',
    shortName: 'Pluto TV'
  },
  'sling tv': {
    logo: slingLogo,
    color: '#0074E4',
    url: 'https://www.sling.com',
    shortName: 'Sling'
  },
  'sling': {
    logo: slingLogo,
    color: '#0074E4',
    url: 'https://www.sling.com',
    shortName: 'Sling'
  },
  'crunchyroll': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/crunchyroll.svg',
    color: '#F47521',
    url: 'https://www.crunchyroll.com',
    shortName: 'Crunchyroll'
  },
  'the roku channel': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roku.svg',
    color: '#662D91',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku'
  },
  'roku channel': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/roku.svg',
    color: '#662D91',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku'
  },
};

function normalizePlatformName(name: string): string {
  return name.toLowerCase().trim();
}

export function StreamingBadges({ platforms, rentPlatforms, buyPlatforms }: StreamingBadgesProps) {
  const allPlatforms = [
    ...(platforms || []).map(p => ({ name: p, type: 'stream' as const })),
    ...(rentPlatforms || []).map(p => ({ name: p, type: 'rent' as const })),
    ...(buyPlatforms || []).map(p => ({ name: p, type: 'buy' as const })),
  ];

  // Deduplicate by shortName
  const seen = new Set<string>();
  const uniquePlatforms = allPlatforms.filter(p => {
    const normalized = normalizePlatformName(p.name);
    const data = PLATFORM_DATA[normalized];
    const key = data?.shortName || p.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);

  if (uniquePlatforms.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">Not available for streaming</p>
    );
  }

  const handleClick = () => {
    hapticLight();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {uniquePlatforms.map(({ name, type }) => {
        const normalized = normalizePlatformName(name);
        const data = PLATFORM_DATA[normalized];
        
        return (
          <a
            key={`${type}-${name}`}
            href={data?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 rounded-md border border-zinc-400 bg-zinc-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-400 active:scale-[0.97] touch-manipulation',
              type === 'rent' && 'border-yellow-500/50',
              type === 'buy' && 'border-green-500/50'
            )}
          >
            {data?.logo ? (
              <img 
                src={data.logo} 
                alt={data.shortName} 
                className="h-7 w-7 rounded-sm object-contain bg-white p-0.5"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <span>{data?.shortName || name}</span>
          </a>
        );
      })}
    </div>
  );
}