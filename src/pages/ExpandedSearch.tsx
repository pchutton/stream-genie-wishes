import { useEffect, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Search, Loader2, Globe, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SEARCH_ENGINE_ID = 'f14f3e698611345bf';

// Magic query suffix to find legal streaming options and filter out signup pages
const MAGIC_SUFFIX = 'legal live stream -inurl:(signup login subscribe account)';

export default function ExpandedSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scriptLoaded = useRef(false);
  const searchExecuted = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Configure Google CSE with bulletproof external link handling
    (window as any).__gcse = {
      parsetags: 'explicit',
      initializationCallback: () => {
        try {
          const googleObj = (window as any).google;
          if (googleObj?.search?.cse?.element) {
            googleObj.search.cse.element.render({
              gname: 'gsearch',
              div: 'live-events-results',
              tag: 'searchresults-only',
              attributes: { 
                linkTarget: '_blank',  // Fallback for basic links
                enableHistory: false   // Keeps it snappy, no URL changes
              },
            });

            // Bulletproof: Override ALL clickable elements to open externally
            setTimeout(() => {
              const resultsContainer = document.getElementById('live-events-results');
              if (resultsContainer) {
                // Listen for clicks on any result element
                resultsContainer.addEventListener('click', function(e) {
                  const link = (e.target as HTMLElement).closest('a');
                  if (link && link.href) {
                    e.preventDefault();  // Stop iframe nonsense
                    window.open(link.href, '_blank', 'noopener,noreferrer');  // Full external open
                  }
                });

                // Also force any embedded images/videos to external
                const embeds = resultsContainer.querySelectorAll('img, iframe');
                embeds.forEach(el => {
                  el.addEventListener('click', function() {
                    const src = (el as HTMLImageElement | HTMLIFrameElement).src;
                    if (src) {
                      window.open(src, '_blank', 'noopener,noreferrer');
                    }
                  });
                });
              }
            }, 500);  // Wait for results to render
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

  const executeSearch = (searchQuery: string) => {
    // Access the Google CSE element and execute search
    const element = (window as any).google?.search?.cse?.element;
    if (element) {
      const searchElement = element.getElement('gsearch');
      if (searchElement) {
        // Combine user query with magic suffix
        const magicQuery = `${searchQuery} ${MAGIC_SUFFIX}`;
        console.log('Executing magic search:', magicQuery);
        searchElement.execute(magicQuery);
        searchExecuted.current = true;
        setIsSearching(false);
        setHasSearched(true);
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
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Hero Section */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-gradient-gold">Expanded</span> Search
          </h1>
          <p className="text-muted-foreground mb-2">
            Find legal streaming options for live events across the web
          </p>
          <p className="text-sm text-muted-foreground/60 flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Results open in a new tab
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-10 animate-slide-up">
          <div className="relative group">
            {/* Glowing background effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-genie-gold to-primary rounded-xl blur-md opacity-50 animate-glow-pulse group-hover:opacity-75 transition-opacity duration-300" />
            
            {/* Search container */}
            <div className="relative flex items-center bg-card rounded-xl border border-border overflow-hidden shadow-lg">
              <div className="flex items-center justify-center w-14 h-14">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for live events... (e.g., UFC 309, Lakers vs Celtics)"
                className="flex-1 h-14 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
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
                className="h-12 px-8 mr-1 rounded-lg genie-glow font-semibold"
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

        {/* Empty State */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Search for live events to find streaming options
            </p>
          </div>
        )}

        {/* Results Container */}
        <div className="gcse-results-container animate-fade-in">
          <div id="live-events-results" className="gcse-searchresults-only"></div>
        </div>
      </div>

      {/* Custom styles for Google CSE using design system tokens */}
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

        /* Hide any embedded preview iframes that external sites may block */
        .gsc-results iframe {
          display: none !important;
        }
        
        .gsc-webResult.gsc-result {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          padding: 20px !important;
          border-radius: var(--radius) !important;
          margin-bottom: 16px !important;
          transition: all 0.3s ease !important;
        }
        
        .gsc-webResult.gsc-result:hover {
          border-color: hsl(var(--primary) / 0.5) !important;
          box-shadow: 0 0 25px hsl(var(--primary) / 0.2), 0 4px 12px hsl(var(--background) / 0.5) !important;
          transform: translateY(-2px) !important;
        }
        
        .gs-title {
          color: hsl(var(--foreground)) !important;
          text-decoration: none !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
        }
        
        .gs-title:hover {
          color: hsl(var(--primary)) !important;
        }
        
        .gs-title b {
          color: hsl(var(--primary)) !important;
        }
        
        .gs-snippet {
          color: hsl(var(--muted-foreground)) !important;
          line-height: 1.7 !important;
          margin-top: 8px !important;
        }
        
        .gs-visibleUrl {
          color: hsl(var(--muted-foreground) / 0.7) !important;
          font-size: 13px !important;
        }
        
        .gsc-cursor-box {
          margin-top: 24px !important;
          text-align: center !important;
        }
        
        .gsc-cursor-page {
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: calc(var(--radius) - 2px) !important;
          padding: 10px 16px !important;
          margin-right: 8px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
        }
        
        .gsc-cursor-page:hover {
          background: hsl(var(--muted)) !important;
          border-color: hsl(var(--primary) / 0.5) !important;
        }
        
        .gsc-cursor-current-page {
          background: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        /* Hide Google branding elements */
        .gsc-control-cse .gsc-table-result {
          font-family: inherit !important;
        }
        
        .gcsc-more-maybe-branding-root {
          display: none !important;
        }
        
        .gsc-above-wrapper-area {
          border-bottom: 1px solid hsl(var(--border)) !important;
          padding-bottom: 12px !important;
          margin-bottom: 16px !important;
        }
        
        .gsc-result-info {
          color: hsl(var(--muted-foreground)) !important;
          padding-left: 0 !important;
          font-size: 14px !important;
        }
        
        /* Thumbnail styling */
        .gs-image-box {
          border-radius: calc(var(--radius) - 4px) !important;
          overflow: hidden !important;
        }
        
        /* No results message */
        .gs-no-results-result .gs-snippet {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 16px !important;
          text-align: center !important;
          padding: 32px !important;
        }
        
        /* Refinement tabs if present */
        .gsc-tabsArea {
          border-bottom: 1px solid hsl(var(--border)) !important;
          margin-bottom: 20px !important;
        }
        
        .gsc-tabHeader {
          background: transparent !important;
          color: hsl(var(--muted-foreground)) !important;
          border: none !important;
          padding: 12px 20px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        
        .gsc-tabHeader:hover {
          color: hsl(var(--foreground)) !important;
        }
        
        .gsc-tabHeader.gsc-tabhActive {
          color: hsl(var(--primary)) !important;
          border-bottom: 2px solid hsl(var(--primary)) !important;
        }

        /* Promoted results */
        .gsc-webResult.gsc-result.gsc-promotion {
          background: hsl(var(--secondary)) !important;
          border-color: hsl(var(--primary) / 0.3) !important;
        }
      `}</style>
    </Layout>
  );
}
