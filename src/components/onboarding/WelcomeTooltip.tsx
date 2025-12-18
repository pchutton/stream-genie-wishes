import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'streamgenie_welcome_shown';

export function WelcomeTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if tooltip was already shown
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      // Delay showing for a smooth entrance after page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(() => setIsVisible(false), 300);
  };

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible && !isExiting) {
      const timer = setTimeout(dismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isExiting]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm mx-4",
        "bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl shadow-xl",
        "transition-all duration-300 ease-out",
        isExiting 
          ? "opacity-0 translate-y-4" 
          : "opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4"
      )}
    >
      <div className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              No account needed!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Save movies, shows & events instantly. Create an account later to sync across devices.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
