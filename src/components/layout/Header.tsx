import { Link, useLocation } from 'react-router-dom';
import { Sparkles, List, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient-gold">StreamGenie</span>
        </Link>

        {/* Navigation */}
        {user && (
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
          </nav>
        )}

        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/pro" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-genie-gold" />
                  Go Pro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="genie-glow">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}