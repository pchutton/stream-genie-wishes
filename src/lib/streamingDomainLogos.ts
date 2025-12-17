import espnLogo from '@/assets/logos/espn.png';
import espnPlusLogo from '@/assets/logos/espn-plus.png';
import peacockLogo from '@/assets/logos/peacock.png';
import paramountPlusLogo from '@/assets/logos/paramount-plus.png';
import primeVideoLogo from '@/assets/logos/prime-video.png';
import huluLogo from '@/assets/logos/hulu.png';
import youtubeTvLogo from '@/assets/logos/youtube-tv.png';
import fubotvLogo from '@/assets/logos/fubotv.png';
import slingLogo from '@/assets/logos/sling.png';
import maxLogo from '@/assets/logos/max.png';
import foxLogo from '@/assets/logos/fox.png';
import cbsLogo from '@/assets/logos/cbs.png';
import nbcLogo from '@/assets/logos/nbc.png';
import abcLogo from '@/assets/logos/abc.png';
import tntLogo from '@/assets/logos/tnt.png';
import directvStreamLogo from '@/assets/logos/directv-stream.png';

interface StreamingPlatform {
  logo: string;
  name: string;
}

// Map domains to their logos
const domainToLogo: Record<string, StreamingPlatform> = {
  // ESPN family
  'espn.com': { logo: espnLogo, name: 'ESPN' },
  'plus.espn.com': { logo: espnPlusLogo, name: 'ESPN+' },
  
  // Streaming services
  'peacocktv.com': { logo: peacockLogo, name: 'Peacock' },
  'paramountplus.com': { logo: paramountPlusLogo, name: 'Paramount+' },
  'primevideo.com': { logo: primeVideoLogo, name: 'Prime Video' },
  'amazon.com/gp/video': { logo: primeVideoLogo, name: 'Prime Video' },
  'hulu.com': { logo: huluLogo, name: 'Hulu' },
  'tv.youtube.com': { logo: youtubeTvLogo, name: 'YouTube TV' },
  'fubo.tv': { logo: fubotvLogo, name: 'FuboTV' },
  'sling.com': { logo: slingLogo, name: 'Sling TV' },
  'max.com': { logo: maxLogo, name: 'Max' },
  'directv.com/stream': { logo: directvStreamLogo, name: 'DIRECTV Stream' },
  'stream.directv.com': { logo: directvStreamLogo, name: 'DIRECTV Stream' },
  
  // Network sites
  'fox.com': { logo: foxLogo, name: 'Fox' },
  'foxsports.com': { logo: foxLogo, name: 'Fox Sports' },
  'cbs.com': { logo: cbsLogo, name: 'CBS' },
  'cbssports.com': { logo: cbsLogo, name: 'CBS Sports' },
  'nbc.com': { logo: nbcLogo, name: 'NBC' },
  'nbcsports.com': { logo: nbcLogo, name: 'NBC Sports' },
  'abc.com': { logo: abcLogo, name: 'ABC' },
  'tnt.com': { logo: tntLogo, name: 'TNT' },
  'tntdrama.com': { logo: tntLogo, name: 'TNT' },
};

/**
 * Get the streaming platform logo for a given URL
 * Returns null if no matching platform is found
 */
export function getLogoForUrl(url: string): StreamingPlatform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const fullPath = hostname + urlObj.pathname;
    
    // Check for path-specific matches first (e.g., amazon.com/gp/video)
    for (const [domain, platform] of Object.entries(domainToLogo)) {
      if (fullPath.startsWith(domain) || hostname === domain || hostname.endsWith('.' + domain)) {
        return platform;
      }
    }
    
    // Check if hostname ends with any known domain
    for (const [domain, platform] of Object.entries(domainToLogo)) {
      if (hostname.includes(domain.split('/')[0])) {
        return platform;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}
