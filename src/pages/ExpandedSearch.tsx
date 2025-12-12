import { useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';

const SEARCH_ENGINE_ID = 'f14f3e698611345bf';

export default function ExpandedSearch() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Only load script once
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Load Google CSE script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://cse.google.com/cse.js?cx=${SEARCH_ENGINE_ID}`;
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Expanded Search</h1>
          <p className="text-muted-foreground mb-8">
            Search across the web for streaming options
          </p>
        </div>

        {/* Google CSE Search Box with Glowing Effect */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative group">
            {/* Glowing background effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-genie-gold to-primary rounded-xl blur-md opacity-75 animate-glow-pulse group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Search container */}
            <div className="relative bg-background rounded-xl border border-border overflow-hidden p-4 gcse-search-container">
              <div className="gcse-searchbox-only" data-resultsUrl="#results"></div>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div id="results" className="max-w-4xl mx-auto gcse-results-container">
          <div className="gcse-searchresults-only"></div>
        </div>
      </div>

      {/* Custom styles for Google CSE */}
      <style>{`
        /* Search box styling */
        .gsc-control-cse {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-family: inherit !important;
        }
        
        .gsc-search-box {
          margin-bottom: 0 !important;
        }
        
        .gsc-input-box {
          background: hsl(220 25% 12%) !important;
          border: 1px solid hsl(220 20% 20%) !important;
          border-radius: 8px !important;
          height: 48px !important;
        }
        
        .gsc-input {
          background: transparent !important;
          color: hsl(220 15% 95%) !important;
          padding: 12px 16px !important;
          font-size: 16px !important;
        }
        
        .gsc-input::placeholder {
          color: hsl(220 15% 60%) !important;
        }
        
        .gsc-search-button {
          margin-left: 8px !important;
        }
        
        .gsc-search-button-v2 {
          background: hsl(0 95% 55%) !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          cursor: pointer !important;
          min-width: 48px !important;
          height: 48px !important;
        }
        
        .gsc-search-button-v2:hover {
          background: hsl(0 95% 45%) !important;
        }
        
        .gsc-search-button-v2 svg {
          fill: white !important;
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
        }
        
        .gsc-webResult.gsc-result:hover {
          border-color: hsl(0 95% 55% / 0.5) !important;
          box-shadow: 0 0 20px hsl(0 95% 55% / 0.2) !important;
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
        }
        
        .gsc-cursor-page {
          background: hsl(220 25% 16%) !important;
          color: hsl(220 15% 95%) !important;
          border: 1px solid hsl(220 20% 20%) !important;
          border-radius: 6px !important;
          padding: 8px 14px !important;
          margin-right: 8px !important;
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
      `}</style>
    </Layout>
  );
}
