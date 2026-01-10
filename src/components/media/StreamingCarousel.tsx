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
import espnLogo from '@/assets/logos/espn.png';
import espnPlusLogo from '@/assets/logos/espn-plus.png';

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
  'hbo max amazon channel': {
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
  'peacock premium plus': {
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
  'crunchyroll': {
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/crunchyroll.svg',
    color: '#F47521',
    url: 'https://www.crunchyroll.com',
    shortName: 'Crunchyroll'
  },
  'starz': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Starz_2016.svg',
    color: '#000000',
    url: 'https://www.starz.com',
    shortName: 'Starz'
  },
  'showtime': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Showtime.svg',
    color: '#FF0000',
    url: 'https://www.sho.com',
    shortName: 'Showtime'
  },
  'amc plus': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Amc_plus.svg',
    color: '#000000',
    url: 'https://www.amcplus.com',
    shortName: 'AMC+'
  },
  'amc+': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Amc_plus.svg',
    color: '#000000',
    url: 'https://www.amcplus.com',
    shortName: 'AMC+'
  },
  'mgm plus': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/MGM%2B_logo.svg',
    color: '#000000',
    url: 'https://www.mgmplus.com',
    shortName: 'MGM+'
  },
  'mgm+': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/MGM%2B_logo.svg',
    color: '#000000',
    url: 'https://www.mgmplus.com',
    shortName: 'MGM+'
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
  'espn': {
    logo: espnLogo,
    color: '#CC0000',
    url: 'https://www.espn.com/watch',
    shortName: 'ESPN'
  },
  'espn+': {
    logo: espnPlusLogo,
    color: '#CC0000',
    url: 'https://plus.espn.com',
    shortName: 'ESPN+'
  },
  'espn plus': {
    logo: espnPlusLogo,
    color: '#CC0000',
    url: 'https://plus.espn.com',
    shortName: 'ESPN+'
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
    <div 
      className="flex gap-2.5 overflow-x-auto px-1 pb-2 -mx-1"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {offers.map((offer, index) => (
        <StreamingCard key={`${offer.type}-${index}`} offer={offer} />
      ))}
    </div>
  );
}

const BADGE_STYLES = {
  subscription: 'bg-purple-500/20 text-purple-400',
  rent: 'bg-orange-500/20 text-orange-400',
  buy: 'bg-blue-500/20 text-blue-400',
} as const;

const BADGE_LABELS = {
  subscription: 'Stream',
  rent: 'Rent',
  buy: 'Buy',
} as const;

function StreamingCard({ offer }: { offer: StreamingOffer }) {
  const badgeStyle = BADGE_STYLES[offer.type] || 'bg-green-500/20 text-green-400';
  const badgeLabel = BADGE_LABELS[offer.type] || 'Stream';

  const CardContent = (
    <>
      <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center">
        {offer.logo ? (
          <img 
            src={offer.logo} 
            alt="" 
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-2xl font-bold text-zinc-400">{offer.shortName[0]}</span>
        )}
      </div>
      <span className="text-[11px] text-white font-medium truncate max-w-[70px]">
        {offer.shortName}
      </span>
      <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', badgeStyle)}>
        {badgeLabel}
      </span>
    </>
  );

  const baseClasses = "shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-700/60 w-[90px] active:opacity-70";

  if (offer.url !== '#') {
    return (
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        onClick={hapticLight}
        draggable={false}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <div className={baseClasses} onClick={hapticLight}>
      {CardContent}
    </div>
  );
}