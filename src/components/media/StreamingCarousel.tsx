import { cn } from '@/lib/utils';
import fubotvLogo from '@/assets/logos/fubotv.png';
import youtubeTvLogo from '@/assets/logos/youtube-tv.png';
import fxLogo from '@/assets/logos/fx.png';

interface StreamingCarouselProps {
  streaming?: string[] | null;
  rent?: string[] | null;
  buy?: string[] | null;
}

interface StreamingOffer {
  name: string;
  type: 'subscription' | 'rent' | 'buy';
  shortName: string;
  logo: string | null;
  url: string;
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
  'hbo max amazon channel': {
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
  'paramount+': {
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
  'peacock premium': {
    logo: 'https://images.justwatch.com/icon/207360008/s100/peacock.webp',
    color: '#000000',
    url: 'https://www.peacocktv.com',
    shortName: 'Peacock'
  },
  'peacock premium plus': {
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
    logo: 'https://images.justwatch.com/icon/267599474/s100/tubi.webp',
    color: '#FA382F',
    url: 'https://tubitv.com',
    shortName: 'Tubi'
  },
  'tubi tv': {
    logo: 'https://images.justwatch.com/icon/267599474/s100/tubi.webp',
    color: '#FA382F',
    url: 'https://tubitv.com',
    shortName: 'Tubi TV'
  },
  'the roku channel': {
    logo: 'https://images.justwatch.com/icon/197101108/s100/the-roku-channel.webp',
    color: '#662D91',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku Channel'
  },
  'roku channel': {
    logo: 'https://images.justwatch.com/icon/197101108/s100/the-roku-channel.webp',
    color: '#662D91',
    url: 'https://therokuchannel.roku.com',
    shortName: 'Roku Channel'
  },
  'plex': {
    logo: 'https://images.justwatch.com/icon/284099011/s100/plex.webp',
    color: '#E5A00D',
    url: 'https://www.plex.tv',
    shortName: 'Plex'
  },
  'plex channel': {
    logo: 'https://images.justwatch.com/icon/284099011/s100/plex.webp',
    color: '#E5A00D',
    url: 'https://www.plex.tv',
    shortName: 'Plex Channel'
  },
  'hoopla': {
    logo: 'https://images.justwatch.com/icon/116304621/s100/hoopla.webp',
    color: '#ED1C24',
    url: 'https://www.hoopladigital.com',
    shortName: 'Hoopla'
  },
  'fandango at home': {
    logo: 'https://images.justwatch.com/icon/249324969/s100/vudu.webp',
    color: '#3399FF',
    url: 'https://www.fandango.com/vudu',
    shortName: 'Fandango'
  },
  'fandango': {
    logo: 'https://images.justwatch.com/icon/249324969/s100/vudu.webp',
    color: '#3399FF',
    url: 'https://www.fandango.com/vudu',
    shortName: 'Fandango'
  },
  'pluto tv': {
    logo: 'https://images.justwatch.com/icon/201972279/s100/pluto-tv.webp',
    color: '#282828',
    url: 'https://pluto.tv',
    shortName: 'Pluto TV'
  },
  'kanopy': {
    logo: 'https://images.justwatch.com/icon/116304670/s100/kanopy.webp',
    color: '#5A2D82',
    url: 'https://www.kanopy.com',
    shortName: 'Kanopy'
  },
  'crunchyroll': {
    logo: 'https://images.justwatch.com/icon/281417901/s100/crunchyroll.webp',
    color: '#F47521',
    url: 'https://www.crunchyroll.com',
    shortName: 'Crunchyroll'
  },
  'starz': {
    logo: 'https://images.justwatch.com/icon/208356039/s100/starz.webp',
    color: '#000000',
    url: 'https://www.starz.com',
    shortName: 'Starz'
  },
  'showtime': {
    logo: 'https://images.justwatch.com/icon/208356196/s100/showtime.webp',
    color: '#FF0000',
    url: 'https://www.sho.com',
    shortName: 'Showtime'
  },
  'amc plus': {
    logo: 'https://images.justwatch.com/icon/251704141/s100/amc-plus.webp',
    color: '#000000',
    url: 'https://www.amcplus.com',
    shortName: 'AMC+'
  },
  'mgm plus': {
    logo: 'https://images.justwatch.com/icon/298388461/s100/mgm-plus.webp',
    color: '#000000',
    url: 'https://www.mgmplus.com',
    shortName: 'MGM+'
  },
  'amazon prime video with ads': {
    logo: 'https://images.justwatch.com/icon/52449861/s100/amazon-prime-video.webp',
    color: '#00A8E1',
    url: 'https://www.amazon.com/Prime-Video',
    shortName: 'Prime (Ads)'
  },
  'fawesome': {
    logo: 'https://images.justwatch.com/icon/304279232/s100/fawesome.webp',
    color: '#00B4D8',
    url: 'https://fawesome.tv',
    shortName: 'Fawesome'
  },
};

function normalizePlatformName(name: string): string {
  return name.toLowerCase().trim();
}

export function StreamingCarousel({ streaming, rent, buy }: StreamingCarouselProps) {
  // Build offers from all sources
  const offers: StreamingOffer[] = [];
  const seen = new Set<string>();

  // Add streaming platforms
  (streaming || []).forEach(name => {
    const normalized = normalizePlatformName(name);
    const data = PLATFORM_DATA[normalized];
    const shortName = data?.shortName || name;
    if (seen.has(shortName)) return;
    seen.add(shortName);
    offers.push({
      name,
      type: 'subscription',
      shortName,
      logo: data?.logo || null,
      url: data?.url || '#'
    });
  });

  // Add rent platforms
  (rent || []).forEach(name => {
    const normalized = normalizePlatformName(name);
    const data = PLATFORM_DATA[normalized];
    const shortName = data?.shortName || name;
    if (seen.has(shortName)) return;
    seen.add(shortName);
    offers.push({
      name,
      type: 'rent',
      shortName,
      logo: data?.logo || null,
      url: data?.url || '#'
    });
  });

  // Add buy platforms
  (buy || []).forEach(name => {
    const normalized = normalizePlatformName(name);
    const data = PLATFORM_DATA[normalized];
    const shortName = data?.shortName || name;
    if (seen.has(shortName)) return;
    seen.add(shortName);
    offers.push({
      name,
      type: 'buy',
      shortName,
      logo: data?.logo || null,
      url: data?.url || '#'
    });
  });

  if (offers.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Not available on major platforms yet
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Scrollable container */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
        {/* Spacer for left padding */}
        <div className="shrink-0 w-1" />
        
        {offers.map((offer, index) => (
          <StreamingCard key={`${offer.type}-${offer.name}-${index}`} offer={offer} />
        ))}
        
        {/* Spacer for right padding */}
        <div className="shrink-0 w-1" />
      </div>

      {/* Gradient fades for scroll indication */}
      {offers.length > 3 && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-zinc-800 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-zinc-800 to-transparent" />
        </>
      )}
    </div>
  );
}

function StreamingCard({ offer }: { offer: StreamingOffer }) {
  const getBadgeStyles = () => {
    switch (offer.type) {
      case 'subscription':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Subscription' };
      case 'rent':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Rent' };
      case 'buy':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Buy' };
      default:
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Stream' };
    }
  };

  const { bg, text, label } = getBadgeStyles();

  const content = (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-700/50 p-4 min-w-[110px] snap-start transition-all duration-200 hover:bg-zinc-600/50 hover:scale-105">
      {/* Large logo - 80px for instant recognition */}
      <div className="h-20 w-20 flex items-center justify-center rounded-xl bg-white/10 p-2">
        {offer.logo ? (
          <img 
            src={offer.logo} 
            alt={offer.shortName} 
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-3xl font-bold text-white/60">
            {offer.shortName.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Platform name */}
      <span className="text-xs font-medium text-white text-center leading-tight line-clamp-1">
        {offer.shortName}
      </span>
      
      {/* Type badge */}
      <span className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
        bg, text
      )}>
        {label}
      </span>
    </div>
  );

  return offer.url !== '#' ? (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0"
    >
      {content}
    </a>
  ) : (
    <div className="shrink-0">{content}</div>
  );
}
