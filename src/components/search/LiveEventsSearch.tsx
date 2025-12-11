import { useEffect, useRef } from 'react';

interface LiveEventsSearchProps {
  searchQuery?: string;
}

export function LiveEventsSearch({ searchQuery }: LiveEventsSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Load Google CSE script only once
    if (!scriptLoaded.current) {
      const cx = '826b8f8b020fa46af';
      const gcse = document.createElement('script');
      gcse.type = 'text/javascript';
      gcse.async = true;
      gcse.src = `https://cse.google.com/cse.js?cx=${cx}`;
      document.head.appendChild(gcse);
      scriptLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    // Auto-fill and trigger search when query changes
    if (searchQuery) {
      const attemptSearch = () => {
        const searchBox = document.querySelector('.gsc-search-box input.gsc-input') as HTMLInputElement;
        if (searchBox) {
          searchBox.value = searchQuery + ' legal live stream';
          setTimeout(() => {
            const searchButton = document.querySelector('.gsc-search-button input') as HTMLInputElement;
            if (searchButton) searchButton.click();
          }, 300);
        } else {
          // Retry if elements not yet loaded
          setTimeout(attemptSearch, 500);
        }
      };
      setTimeout(attemptSearch, 800);
    }
  }, [searchQuery]);

  return (
    <div ref={containerRef} className="live-events-search-container">
      <div className="gcse-searchresults-only" data-resultsUrl="/live-events-results"></div>
      
      <style>{`
        .gsc-control-cse {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-family: inherit !important;
        }
        .gsc-results {
          background: transparent !important;
        }
        .gsc-above-wrapper-area {
          border: none !important;
          padding: 0 !important;
        }
        .gs-title, .gs-bidi-start-align {
          color: hsl(var(--foreground)) !important;
          font-family: inherit !important;
        }
        .gs-title a {
          color: hsl(var(--primary)) !important;
          text-decoration: none !important;
        }
        .gs-title a:hover {
          text-decoration: underline !important;
        }
        .gsc-webResult .gsc-result {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          padding: 16px !important;
          border-radius: 12px !important;
          margin-bottom: 12px !important;
        }
        .gs-snippet {
          color: hsl(var(--muted-foreground)) !important;
          font-family: inherit !important;
        }
        .gsc-url-top, .gs-visibleUrl {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 12px !important;
        }
        .gsc-cursor-page {
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--foreground)) !important;
          border: none !important;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          margin: 0 4px !important;
        }
        .gsc-cursor-current-page {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        .gsc-results .gsc-cursor-box {
          text-align: center !important;
          margin-top: 20px !important;
        }
        .gsc-adBlock {
          display: none !important;
        }
        .gcsc-find-more-on-google {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
