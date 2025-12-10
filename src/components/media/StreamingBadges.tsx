import { cn } from '@/lib/utils';

interface StreamingBadgesProps {
  platforms: string[] | null;
  rentPlatforms?: string[] | null;
  buyPlatforms?: string[] | null;
}

const PLATFORM_DATA: Record<string, { logo: string; color: string; url: string; shortName: string }> = {
  'netflix': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/netflix.webp',
    color: '#E50914',
    url: 'https://www.netflix.com',
    shortName: 'Netflix'
  },
  'disney plus': {
    logo: 'https://images.justwatch.com/icon/147638351/s100/disney-plus.webp',
    color: '#113CCF',
    url: 'https://www.disneyplus.com',
    shortName: 'Disney+'
  },
  'hulu': {
    logo: 'https://images.justwatch.com/icon/116305230/s100/hulu.webp',
    color: '#1CE783',
    url: 'https://www.hulu.com',
    shortName: 'Hulu'
  },
  'amazon prime video': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazon-prime-video.webp',
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime'
  },
  'amazon video': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazon-prime-video.webp',
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Amazon'
  },
  'apple tv plus': {
    logo: 'https://images.justwatch.com/icon/190848813/s100/apple-tv-plus.webp',
    color: '#000000',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV+'
  },
  'apple tv': {
    logo: 'https://images.justwatch.com/icon/190848813/s100/apple-tv-plus.webp',
    color: '#000000',
    url: 'https://tv.apple.com',
    shortName: 'Apple TV'
  },
  'max': {
    logo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
    color: '#002BE7',
    url: 'https://www.max.com',
    shortName: 'Max'
  },
  'hbo max': {
    logo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
    color: '#002BE7',
    url: 'https://www.max.com',
    shortName: 'Max'
  },
  'paramount plus': {
    logo: 'https://images.justwatch.com/icon/232599720/s100/paramount-plus.webp',
    color: '#0064FF',
    url: 'https://www.paramountplus.com',
    shortName: 'Paramount+'
  },
  'peacock': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/peacock.webp',
    color: '#000000',
    url: 'https://www.peacocktv.com',
    shortName: 'Peacock'
  },
  'youtube': {
    logo: 'https://images.justwatch.com/icon/59562423/s100/youtube.webp',
    color: '#FF0000',
    url: 'https://www.youtube.com',
    shortName: 'YouTube'
  },
  'google play movies': {
    logo: 'https://images.justwatch.com/icon/169478387/s100/google-play-movies.webp',
    color: '#4285F4',
    url: 'https://play.google.com/store/movies',
    shortName: 'Google Play'
  },
  'vudu': {
    logo: 'https://images.justwatch.com/icon/249324969/s100/vudu.webp',
    color: '#3399FF',
    url: 'https://www.vudu.com',
    shortName: 'Vudu'
  },
  'fubotv': {
    logo: 'https://images.justwatch.com/icon/143702918/s100/fubotv.webp',
    color: '#FF6B00',
    url: 'https://www.fubo.tv',
    shortName: 'FuboTV'
  },
  'fubo tv': {
    logo: 'https://images.justwatch.com/icon/143702918/s100/fubotv.webp',
    color: '#FF6B00',
    url: 'https://www.fubo.tv',
    shortName: 'FuboTV'
  },
  'youtube tv': {
    logo: 'https://images.justwatch.com/icon/158154639/s100/youtube-tv.webp',
    color: '#FF0000',
    url: 'https://tv.youtube.com',
    shortName: 'YouTube TV'
  },
  'fx': {
    logo: 'https://images.justwatch.com/icon/116305489/s100/fx.webp',
    color: '#000000',
    url: 'https://www.fxnetworks.com',
    shortName: 'FX'
  },
  'fx now': {
    logo: 'https://images.justwatch.com/icon/116305489/s100/fx.webp',
    color: '#000000',
    url: 'https://www.fxnetworks.com',
    shortName: 'FX'
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
            className={cn(
              'flex items-center gap-2 rounded-md border border-border bg-zinc-700 px-2.5 py-1.5 text-xs transition-colors hover:bg-zinc-600',
              type === 'rent' && 'border-yellow-500/30',
              type === 'buy' && 'border-green-500/30'
            )}
          >
            {data?.logo ? (
              <img 
                src={data.logo} 
                alt={data.shortName} 
                className="h-6 w-6 rounded-sm object-contain"
              />
            ) : null}
            <span>{data?.shortName || name}</span>
          </a>
        );
      })}
    </div>
  );
}
