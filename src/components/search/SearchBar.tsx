import { useState } from 'react';
import { Search, X, Loader2, Tv, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SearchMode = 'media' | 'live';

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
  const [mode, setMode] = useState<SearchMode>('media');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), mode);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'media' ? 'live' : 'media');
    setQuery('');
  };

  const currentPlaceholder = placeholder || (
    mode === 'media' 
      ? 'Find Your Show. Compare Every Streaming Option.' 
      : 'Search for live events, sports, concerts...'
  );

  const isLive = mode === 'live';

  return (
    <form onSubmit={handleSubmit} className={cn('relative group', className)}>
      {/* Glowing background effect */}
      <div className={cn(
        "absolute -top-1 -right-1 -bottom-1 left-0 rounded-2xl blur-md transition-opacity duration-300",
        "animate-glow-pulse group-hover:opacity-75",
        isLive 
          ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 opacity-40"
          : "bg-gradient-to-r from-primary via-genie-gold to-primary opacity-50"
      )} />
      
      <div className="relative">
        {/* Mode Toggle */}
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
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-300",
            "active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            isLive 
              ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 focus:ring-emerald-500"
              : "bg-primary/20 hover:bg-primary/30 border border-primary/40 focus:ring-primary"
          )}
          title={mode === 'media' ? 'Switch to Live Events' : 'Switch to TV/Movies'}
        >
          <div className={cn(
            "relative w-[60px] h-[32px] rounded-lg bg-background/80 border overflow-hidden transition-all duration-300 active:scale-90",
            isLive ? "border-emerald-500/50" : "border-border"
          )}>
            <div 
              className={cn(
                "absolute top-[2px] w-[28px] h-[28px] rounded-md flex items-center justify-center",
                "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isLive 
                  ? 'left-[28px] bg-emerald-500' 
                  : 'left-[2px] bg-primary'
              )}
            >
              <div className={cn(
                "transition-transform duration-300",
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
          <span className={cn(
            "text-sm font-medium pr-14 w-[55px] text-left transition-colors duration-300",
            isLive ? "text-emerald-400" : "text-foreground/80"
          )}>
            {mode === 'media' ? 'TV/Movie' : 'Live'}
          </span>
        </button>

        <div className="absolute left-[180px] top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Search className={cn(
            "h-5 w-5 transition-colors duration-300",
            isLive ? "text-emerald-400" : "text-muted-foreground"
          )} />
        </div>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentPlaceholder}
          className={cn(
            "h-14 rounded-2xl border-2 bg-card pl-[205px] pr-24 text-lg text-center transition-all duration-300",
            isLive 
              ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          )}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
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
  );
}
