import { FC } from 'react';

interface NetworkLogoProps {
  className?: string;
}

// ESPN Logo - Red background with white text
export const ESPNLogo: FC<NetworkLogoProps> = ({ className = "w-12 h-6" }) => (
  <svg className={className} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="32" rx="4" fill="#D12027"/>
    <text x="40" y="22" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="bold">ESPN</text>
  </svg>
);

// ABC Logo - Black circle with white letters
export const ABCLogo: FC<NetworkLogoProps> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15" fill="#000"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold">abc</text>
  </svg>
);

// Fox Logo - Blue text
export const FoxLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 60 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="32" rx="4" fill="#003087"/>
    <text x="30" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="bold">FOX</text>
  </svg>
);

// Fox Sports Logo
export const FoxSportsLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 90 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="90" height="28" rx="4" fill="#003087"/>
    <text x="45" y="12" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="8" fontWeight="bold">FOX</text>
    <text x="45" y="22" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="7">SPORTS</text>
  </svg>
);

// FS1 Logo
export const FS1Logo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#003087"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">FS1</text>
  </svg>
);

// CBS Logo - Eye shape simplified
export const CBSLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#1C4587"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">CBS</text>
  </svg>
);

// NBC Logo - Peacock colors simplified
export const NBCLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#6B2D7B"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">NBC</text>
  </svg>
);

// Peacock Logo
export const PeacockLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="peacockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6B2D7B"/>
        <stop offset="50%" stopColor="#F7B500"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
    </defs>
    <rect width="80" height="28" rx="4" fill="url(#peacockGrad)"/>
    <text x="40" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold">PEACOCK</text>
  </svg>
);

// Prime Video Logo
export const PrimeVideoLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#00A8E1"/>
    <text x="40" y="12" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold">prime</text>
    <text x="40" y="22" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold">video</text>
  </svg>
);

// NFL Network Logo
export const NFLNetworkLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#013369"/>
    <text x="40" y="12" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="9" fontWeight="bold">NFL</text>
    <text x="40" y="22" textAnchor="middle" fill="#D50A0A" fontFamily="Arial, sans-serif" fontSize="7">NETWORK</text>
  </svg>
);

// NBA TV Logo
export const NBATVLogo: FC<NetworkLogoProps> = ({ className = "w-12 h-6" }) => (
  <svg className={className} viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="28" rx="4" fill="#C8102E"/>
    <text x="30" y="12" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="9" fontWeight="bold">NBA</text>
    <text x="30" y="22" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="7">TV</text>
  </svg>
);

// MLB Network Logo
export const MLBNetworkLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#002D72"/>
    <text x="40" y="12" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="9" fontWeight="bold">MLB</text>
    <text x="40" y="22" textAnchor="middle" fill="#C8102E" fontFamily="Arial, sans-serif" fontSize="7">NETWORK</text>
  </svg>
);

// TNT Logo
export const TNTLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#D12027"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">TNT</text>
  </svg>
);

// TBS Logo
export const TBSLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#00A0DC"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">TBS</text>
  </svg>
);

// USA Network Logo
export const USANetworkLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#0046AD"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="bold">USA</text>
  </svg>
);

// Paramount+ Logo
export const ParamountPlusLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#0064FF"/>
    <text x="40" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold">Paramount+</text>
  </svg>
);

// YouTube TV Logo
export const YouTubeTVLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#FF0000"/>
    <text x="40" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold">YouTube TV</text>
  </svg>
);

// Hulu Logo
export const HuluLogo: FC<NetworkLogoProps> = ({ className = "w-12 h-6" }) => (
  <svg className={className} viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="28" rx="4" fill="#1CE783"/>
    <text x="30" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold">hulu</text>
  </svg>
);

// ESPN+ Logo
export const ESPNPlusLogo: FC<NetworkLogoProps> = ({ className = "w-14 h-6" }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#D12027"/>
    <text x="40" y="18" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="bold">ESPN+</text>
  </svg>
);

// FuboTV Logo
export const FuboTVLogo: FC<NetworkLogoProps> = ({ className = "w-12 h-6" }) => (
  <svg className={className} viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="28" rx="4" fill="#FA4616"/>
    <text x="30" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold">fuboTV</text>
  </svg>
);

// FX Logo
export const FXLogo: FC<NetworkLogoProps> = ({ className = "w-10 h-8" }) => (
  <svg className={className} viewBox="0 0 50 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="32" rx="4" fill="#000"/>
    <text x="25" y="21" textAnchor="middle" fill="white" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="bold">FX</text>
  </svg>
);

// Generic fallback for unknown networks
export const GenericNetworkLogo: FC<NetworkLogoProps & { name: string }> = ({ className = "w-14 h-6", name }) => (
  <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="28" rx="4" fill="#374151"/>
    <text x="40" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold">{name}</text>
  </svg>
);

// Map of platform names to their logo components
export const NetworkLogoMap: Record<string, FC<NetworkLogoProps>> = {
  'ESPN': ESPNLogo,
  'ESPN+': ESPNPlusLogo,
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
  'fuboTV': FuboTVLogo,
  'FuboTV': FuboTVLogo,
  'FX': FXLogo,
};

// Helper component to render a network logo by name
export const NetworkLogo: FC<{ platform: string; className?: string }> = ({ platform, className }) => {
  const LogoComponent = NetworkLogoMap[platform];
  
  if (LogoComponent) {
    return <LogoComponent className={className} />;
  }
  
  return <GenericNetworkLogo name={platform} className={className} />;
};
