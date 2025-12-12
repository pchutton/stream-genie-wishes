import { useEffect, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SEARCH_ENGINE_ID = 'f14f3e698611345bf';

// Magic query suffix to find legal streaming options and filter out signup pages
const MAGIC_SUFFIX = 'legal live stream -inurl:(signup login subscribe account)';

export default function ExpandedSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scriptLoaded = useRef(false);
  const searchExecuted = useRef(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Configure Google CSE to render explicitly so we can control link target
    (window as any).__gcse = {
      parsetags: 'explicit',
      callback: () => {
        try {
          const googleObj = (window as any).google;
          if (googleObj?.search?.cse?.element) {
            googleObj.search.cse.element.render({
              div: 'gcse-results',
              tag: 'searchresults-only',
              attributes: { linkTarget: '_blank' },
            });
          }
        } catch (err) {
          console.error('Error rendering Google CSE element', err);
        }
      },
    };

    // Load Google CSE script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://cse.google.com/cse.js?cx=${SEARCH_ENGINE_ID}`;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }, []);

  // Force all Expanded Search result links to open in a new tab
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor || !resultsRef.current) return;
      if (!resultsRef.current.contains(anchor)) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Intercept and open in a new tab instead of inside the iframe
      event.preventDefault();
      event.stopPropagation();
      window.open(href, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const executeSearch = (searchQuery: string) => {
    // Access the Google CSE element and execute search
    const element = (window as any).google?.search?.cse?.element;
    if (element) {
      const searchElement = element.getElement('searchresults-only0');
      if (searchElement) {
        // Combine user query with magic suffix
        const magicQuery = `${searchQuery} ${MAGIC_SUFFIX}`;
        console.log('Executing magic search:', magicQuery);
        searchElement.execute(magicQuery);
        searchExecuted.current = true;
        setIsSearching(false);
      } else {
        // Retry after a short delay if element not ready
        setTimeout(() => executeSearch(searchQuery), 500);
      }
    } else {
      // Retry after a short delay if Google CSE not ready
      setTimeout(() => executeSearch(searchQuery), 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    executeSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Expanded Search</h1>
          <p className="text-muted-foreground mb-2">
            Find legal streaming options for live events
          </p>
          <p className="text-sm text-muted-foreground/60">
            Automatically filters out signup walls and finds legitimate streams
          </p>
        </div>

        {/* Custom Glowing Search Bar */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-8">
          <div className="relative group">
            {/* Glowing background effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-genie-gold to-primary rounded-xl blur-md opacity-75 animate-glow-pulse group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Search container */}
            <div className="relative flex items-center bg-background rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-center w-14 h-14">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for live events... (e.g., UFC 309, Lakers vs Celtics)"
                className="flex-1 h-14 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="mr-2 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={isSearching || !query.trim()}
                className="h-12 px-8 mr-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Results Container - Hide default search box, only show results */}
        <div className="max-w-4xl mx-auto gcse-results-container" ref={resultsRef}>
          <div id="gcse-results" className="gcse-searchresults-only"></div>
        </div>
      </div>

      {/* Custom styles for Google CSE */}
      <style>{`
        /* Hide the default Google search box since we use our own */
        .gsc-control-cse .gsc-search-box {
          display: none !important;
        }
        
        .gsc-control-cse {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-family: inherit !important;
        }

        /* Results styling */
        .gsc-results {
          background: transparent !important;
        }
        
        .gsc-webResult.gsc-result {
          background: hsl(220 25% 12%) !important;
          border: 1px solid hsl(220 20% 20%) !important;
          padding: 16px !important;
          border-radius: 12px !important;
          margin-bottom: 12px !important;
          transition: all 0.2s ease !important;
        }
        
        .gsc-webResult.gsc-result:hover {
          border-color: hsl(0 95% 55% / 0.5) !important;
          box-shadow: 0 0 20px hsl(0 95% 55% / 0.2) !important;
          transform: translateY(-2px) !important;
        }
        
        .gs-title {
          color: hsl(220 15% 95%) !important;
          text-decoration: none !important;
          font-size: 18px !important;
          font-weight: 600 !important;
        }
        
        .gs-title:hover {
          color: hsl(0 95% 55%) !important;
        }
        
        .gs-title b {
          color: hsl(0 95% 55%) !important;
        }
        
        .gs-snippet {
          color: hsl(220 15% 70%) !important;
          line-height: 1.6 !important;
        }
        
        .gs-visibleUrl {
          color: hsl(220 15% 50%) !important;
        }
        
        .gsc-cursor-box {
          margin-top: 20px !important;
          text-align: center !important;
        }
        
        .gsc-cursor-page {
          background: hsl(220 25% 16%) !important;
          color: hsl(220 15% 95%) !important;
          border: 1px solid hsl(220 20% 20%) !important;
          border-radius: 6px !important;
          padding: 8px 14px !important;
          margin-right: 8px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        
        .gsc-cursor-page:hover {
          background: hsl(220 25% 20%) !important;
          border-color: hsl(0 95% 55% / 0.5) !important;
        }
        
        .gsc-cursor-current-page {
          background: hsl(0 95% 55%) !important;
          border-color: hsl(0 95% 55%) !important;
        }
        
        /* Hide Google branding elements */
        .gsc-control-cse .gsc-table-result {
          font-family: inherit !important;
        }
        
        .gcsc-more-maybe-branding-root {
          display: none !important;
        }
        
        .gsc-above-wrapper-area {
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
        
        .gsc-result-info {
          color: hsl(220 15% 60%) !important;
          padding-left: 0 !important;
        }
        
        /* Thumbnail styling */
        .gs-image-box {
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        
        /* No results message */
        .gs-no-results-result .gs-snippet {
          color: hsl(220 15% 60%) !important;
          font-size: 16px !important;
        }
        
        /* Refinement tabs if present */
        .gsc-tabsArea {
          border-bottom: 1px solid hsl(220 20% 20%) !important;
          margin-bottom: 16px !important;
        }
        
        .gsc-tabHeader {
          background: transparent !important;
          color: hsl(220 15% 70%) !important;
          border: none !important;
          padding: 8px 16px !important;
        }
        
        .gsc-tabHeader.gsc-tabhActive {
          color: hsl(0 95% 55%) !important;
          border-bottom: 2px solid hsl(0 95% 55%) !important;
        }
      `}</style>
    </Layout>
  );
}
