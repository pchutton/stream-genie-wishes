import { Link, useLocation } from 'react-router-dom';
import { Sparkles, List, User, Search, Heart, UserPlus, Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSearchMode } from '@/contexts/SearchModeContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, isAnonymous } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const { searchMode } = useSearchMode();
  
  const isLiveMode = searchMode === 'live';
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md transition-colors duration-500",
      isLiveMode ? "border-emerald-500/40" : "border-primary/40"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500 group-hover:scale-110",
            isLiveMode ? "bg-emerald-500 logo-backlit-live" : "bg-primary logo-backlit"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-lg transition-colors duration-500",
              isLiveMode ? "bg-emerald-500 animate-logo-pulse-live" : "bg-primary animate-logo-pulse"
            )} />
            <Sparkles className="relative z-10 h-5 w-5 text-primary-foreground" />
          </div>
          {/* Layered text for smooth gradient transition */}
          <span className="relative text-xl font-bold">
            <span className={cn(
              "text-gradient-gold logo-glow transition-opacity duration-500",
              isLiveMode ? "opacity-0" : "opacity-100"
            )}>StreamGenie</span>
            <span className={cn(
              "absolute inset-0 text-gradient-live logo-glow-live transition-opacity duration-500",
              isLiveMode ? "opacity-100" : "opacity-0"
            )}>StreamGenie</span>
          </span>
        </Link>

        {/* Navigation - Always show since anonymous users are logged in */}
        <nav className="flex items-center gap-1">
          <Link to="/">
            <Button
              variant={isActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          <Link to="/watchlist">
            <Button
              variant={isActive('/watchlist') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Watchlist</span>
            </Button>
          </Link>
          <Link to="/my-events">
            <Button
              variant={isActive('/my-events') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">My Events</span>
            </Button>
          </Link>
          <Link to="/expanded-search">
            <Button
              variant={isActive('/expanded-search') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Expanded</span>
            </Button>
          </Link>
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2">
                {isAnonymous ? <UserPlus className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {isAnonymous ? 'Create Account' : 'Settings'}
              </Link>
            </DropdownMenuItem>
            {isAnonymous && (
              <>
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Sync data across devices
                </p>
                <DropdownMenuItem asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Log In
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/mappings" className="flex items-center gap-2 text-primary">
                    <Shield className="h-4 w-4" />
                    Admin: Mappings
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
