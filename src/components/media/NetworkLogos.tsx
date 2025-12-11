import { FC } from 'react';

// Import logo images
import espnLogo from '@/assets/logos/espn.png';
import abcLogo from '@/assets/logos/abc.png';
import cbsLogo from '@/assets/logos/cbs.png';
import nbcLogo from '@/assets/logos/nbc.png';
import foxLogo from '@/assets/logos/fox.png';
import peacockLogo from '@/assets/logos/peacock.png';
import primeVideoLogo from '@/assets/logos/prime-video.png';
import huluLogo from '@/assets/logos/hulu.png';
import paramountPlusLogo from '@/assets/logos/paramount-plus.png';
import maxLogo from '@/assets/logos/max.png';
import slingLogo from '@/assets/logos/sling.png';
import directvStreamLogo from '@/assets/logos/directv-stream.png';
import tntLogo from '@/assets/logos/tnt.png';
import espnPlusLogo from '@/assets/logos/espn-plus.png';
import youtubetvLogo from '@/assets/logos/youtube-tv.png';
import fubotvLogo from '@/assets/logos/fubotv.png';
import fxLogo from '@/assets/logos/fx.png';

interface NetworkLogoProps {
  className?: string;
}

// Image-based logo component
const ImageLogo: FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = "h-8" }) => (
  <img 
    src={src} 
    alt={alt} 
    className={`${className} w-auto object-contain rounded`}
  />
);

// ESPN Logo
export const ESPNLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={espnLogo} alt="ESPN" className={className} />
);

// ABC Logo
export const ABCLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={abcLogo} alt="ABC" className={className} />
);

// CBS Logo
export const CBSLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={cbsLogo} alt="CBS" className={className} />
);

// NBC Logo
export const NBCLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={nbcLogo} alt="NBC" className={className} />
);

// Fox Logo
export const FoxLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={foxLogo} alt="FOX" className={className} />
);

// Fox Sports Logo (use Fox logo)
export const FoxSportsLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={foxLogo} alt="Fox Sports" className={className} />
);

// FS1 Logo (use Fox logo)
export const FS1Logo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={foxLogo} alt="FS1" className={className} />
);

// Peacock Logo
export const PeacockLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={peacockLogo} alt="Peacock" className={className} />
);

// Prime Video Logo
export const PrimeVideoLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={primeVideoLogo} alt="Prime Video" className={className} />
);

// Hulu Logo
export const HuluLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={huluLogo} alt="Hulu" className={className} />
);

// Hulu + Live TV Logo
export const HuluLiveTVLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={huluLogo} alt="Hulu + Live TV" className={className} />
);

// Paramount+ Logo
export const ParamountPlusLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={paramountPlusLogo} alt="Paramount+" className={className} />
);

// Max Logo
export const MaxLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={maxLogo} alt="Max" className={className} />
);

// Sling Logo
export const SlingLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={slingLogo} alt="Sling" className={className} />
);

// DirecTV Stream Logo
export const DirecTVStreamLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={directvStreamLogo} alt="DirecTV Stream" className={className} />
);

// TNT Logo
export const TNTLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={tntLogo} alt="TNT" className={className} />
);

// TBS Logo (use TNT logo as fallback with text overlay)
export const TBSLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#00A0DC"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">TBS</text>
  </svg>
);

// ESPN+ Logo
export const ESPNPlusLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={espnPlusLogo} alt="ESPN+" className={className} />
);

// YouTube TV Logo
export const YouTubeTVLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={youtubetvLogo} alt="YouTube TV" className={className} />
);

// FuboTV Logo
export const FuboTVLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={fubotvLogo} alt="fuboTV" className={className} />
);

// FX Logo
export const FXLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={fxLogo} alt="FX" className={className} />
);

// NFL Network Logo (SVG fallback)
export const NFLNetworkLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="32" rx="4" fill="#013369"/>
    <text x="40" y="14" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="bold">NFL</text>
    <text x="40" y="25" textAnchor="middle" fill="#D50A0A" fontFamily="Arial, sans-serif" fontSize="8">NETWORK</text>
  </svg>
);

// NBA TV Logo (SVG fallback)
export const NBATVLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 60 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="32" rx="4" fill="#C8102E"/>
    <text x="30" y="14" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="bold">NBA</text>
    <text x="30" y="25" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="8">TV</text>
  </svg>
);

// MLB Network Logo (SVG fallback)
export const MLBNetworkLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="32" rx="4" fill="#002D72"/>
    <text x="40" y="14" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="bold">MLB</text>
    <text x="40" y="25" textAnchor="middle" fill="#C8102E" fontFamily="Arial, sans-serif" fontSize="8">NETWORK</text>
  </svg>
);

// USA Network Logo (SVG fallback)
export const USANetworkLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#0046AD"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">USA</text>
  </svg>
);

// ESPN App Logo (use ESPN logo)
export const ESPNAppLogo: FC<NetworkLogoProps> = ({ className = "h-8" }) => (
  <ImageLogo src={espnLogo} alt="ESPN App" className={className} />
);

// Generic fallback for unknown networks
export const GenericNetworkLogo: FC<NetworkLogoProps & { name: string }> = ({ className = "h-8", name }) => (
  <svg className={className} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="32" rx="4" fill="#374151"/>
    <text x="40" y="20" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold">{name}</text>
  </svg>
);

// Map of platform names to their logo components
export const NetworkLogoMap: Record<string, FC<NetworkLogoProps>> = {
  'ESPN': ESPNLogo,
  'ESPN2': ESPNLogo,
  'ESPN+': ESPNPlusLogo,
  'ESPN App': ESPNAppLogo,
  'ABC': ABCLogo,
  'Fox': FoxLogo,
  'FOX': FoxLogo,
  'Fox Sports': FoxSportsLogo,
  'FS1': FS1Logo,
  'CBS': CBSLogo,
  'NBC': NBCLogo,
  'Peacock': PeacockLogo,
  'Prime Video': PrimeVideoLogo,
  'Amazon Prime Video': PrimeVideoLogo,
  'Amazon Prime': PrimeVideoLogo,
  'NFL Network': NFLNetworkLogo,
  'NBA TV': NBATVLogo,
  'MLB Network': MLBNetworkLogo,
  'TNT': TNTLogo,
  'TBS': TBSLogo,
  'USA Network': USANetworkLogo,
  'USA': USANetworkLogo,
  'Paramount+': ParamountPlusLogo,
  'YouTube TV': YouTubeTVLogo,
  'Hulu': HuluLogo,
  'Hulu + Live TV': HuluLiveTVLogo,
  'fuboTV': FuboTVLogo,
  'FuboTV': FuboTVLogo,
  'Fubo': FuboTVLogo,
  'FX': FXLogo,
  'Max': MaxLogo,
  'HBO Max': MaxLogo,
  'Sling': SlingLogo,
  'Sling Orange': SlingLogo,
  'Sling Blue': SlingLogo,
  'DirecTV Stream': DirecTVStreamLogo,
};

// Helper component to render a network logo by name
export const NetworkLogo: FC<{ platform: string; className?: string }> = ({ platform, className = "h-8" }) => {
  const LogoComponent = NetworkLogoMap[platform];
  
  if (LogoComponent) {
    return <LogoComponent className={className} />;
  }
  
  return <GenericNetworkLogo name={platform} className={className} />;
};
