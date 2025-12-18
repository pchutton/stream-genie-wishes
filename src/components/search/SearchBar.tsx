import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Tv, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSearchMode, SearchMode } from '@/contexts/SearchModeContext';
import { useIsMobile } from '@/hooks/use-mobile';

export type { SearchMode };

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  onSearch, 
  isLoading = false,
  placeholder,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const { searchMode: mode, setSearchMode } = useSearchMode();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  // Use ref for onSearch to avoid triggering effect on every render
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Debounced search-as-you-type
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        onSearchRef.current(query.trim(), mode);
      }, 500);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, mode]); // Removed onSearch from deps - using ref instead

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (query.trim()) {
      onSearch(query.trim(), mode);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const toggleMode = () => {
    setSearchMode(mode === 'media' ? 'live' : 'media');
    setQuery('');
  };

  const currentPlaceholder = placeholder || (
    mode === 'media' 
      ? (isMobile ? 'Search movies & TV...' : 'Find Your Show. Compare Every Streaming Option.')
      : (isMobile ? 'Search any game or sport...' : 'Search any game. Any team. Any sport.')
  );

  const isLive = mode === 'live';

  return (
    <div className={cn('space-y-5 px-4 sm:px-0', className)}>
      {/* Screen reader announcement for mode changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Search mode: {mode === 'media' ? 'TV and Movies' : 'Live Events'}
      </div>

      {/* Mode Toggle - Above search bar */}
      <div className="flex justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={isLive}
          aria-label={`Search mode: ${mode === 'media' ? 'TV and Movies' : 'Live Events'}. Press to switch.`}
          onClick={toggleMode}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMode();
            }
          }}
          className={cn(
            "relative flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300",
            "active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            isLive 
              ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/50 focus:ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              : "bg-primary/15 hover:bg-primary/25 border-2 border-primary/50 focus:ring-primary shadow-[0_0_25px_rgba(239,68,68,0.2)]"
          )}
          title={mode === 'media' ? 'Switch to Live Events' : 'Switch to TV/Movies'}
        >
          {/* Left Label - TV/Movie */}
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            !isLive ? "opacity-100" : "opacity-40"
          )}>
            <Tv className={cn(
              "h-5 w-5 transition-colors duration-300",
              !isLive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-semibold transition-colors duration-300",
              !isLive ? "text-primary" : "text-muted-foreground"
            )}>
              TV/Movie
            </span>
          </div>

          {/* Toggle Track */}
          <div className={cn(
            "relative w-[72px] h-[40px] rounded-full border-2 overflow-hidden transition-all duration-300",
            isLive 
              ? "bg-emerald-500/20 border-emerald-500/60" 
              : "bg-primary/20 border-primary/60"
          )}>
            {/* Toggle Knob */}
            <div 
              className={cn(
                "absolute top-[4px] w-[32px] h-[32px] rounded-full flex items-center justify-center shadow-lg",
                "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isLive 
                  ? 'left-[34px] bg-emerald-500 shadow-emerald-500/50' 
                  : 'left-[4px] bg-primary shadow-primary/50'
              )}
            >
              <div className={cn(
                "transition-transform duration-500",
                isLive ? 'rotate-[360deg]' : 'rotate-0'
              )}>
                {mode === 'media' ? (
                  <Tv className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Radio className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Right Label - Live */}
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isLive ? "opacity-100" : "opacity-40"
          )}>
            <Radio className={cn(
              "h-5 w-5 transition-colors duration-300",
              isLive ? "text-emerald-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-semibold transition-colors duration-300",
              isLive ? "text-emerald-400" : "text-muted-foreground"
            )}>
              Live
            </span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glowing background effect */}
        <div className={cn(
          "absolute -inset-1 rounded-2xl blur-md transition-opacity duration-300",
          "animate-glow-pulse group-hover:opacity-75",
          isLive 
            ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 opacity-40"
            : "bg-gradient-to-r from-primary via-genie-gold to-primary opacity-50"
        )} />
        
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Search className={cn(
              "h-5 w-5 transition-colors duration-300",
              isLive ? "text-emerald-400" : "text-muted-foreground"
            )} />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentPlaceholder}
            aria-label={mode === 'media' ? 'Search movies and TV shows' : 'Search live events and sports'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className={cn(
              "h-14 rounded-2xl border-2 bg-card pl-12 pr-28 text-lg transition-all duration-300",
              isLive 
                ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button 
              type="submit" 
              size="sm"
              disabled={!query.trim() || isLoading}
              className={cn(
                "h-10 rounded-xl transition-all duration-300",
                isLive 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "genie-glow"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
