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

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        {/* Mode Toggle */}
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-300",
            "bg-primary/25 hover:bg-primary/35 border border-primary/50"
          )}
          title={mode === 'media' ? 'Switch to Live Events' : 'Switch to Movies & TV'}
        >
          <div className="relative w-[62px] h-[31px] rounded-full bg-background border border-border overflow-hidden">
            <div 
              className={cn(
                "absolute top-[3px] w-[25px] h-[25px] rounded-full bg-primary transition-all duration-300 flex items-center justify-center",
                mode === 'media' ? 'left-[3px]' : 'left-[calc(100%-28px)]'
              )}
            >
              {mode === 'media' ? (
                <Tv className="h-4 w-4 text-primary-foreground" />
              ) : (
                <Radio className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
            {mode === 'media' ? 'TV' : 'Live'}
          </span>
        </button>

        <Search className="absolute left-[125px] top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentPlaceholder}
          className="h-14 rounded-2xl border-2 border-border bg-card pl-[155px] pr-24 text-lg transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            className="h-10 rounded-xl genie-glow"
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