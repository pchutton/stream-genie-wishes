import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ExpandedSearch() {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic will be added later
    console.log('Searching for:', query);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Expanded Search</h1>
          <p className="text-muted-foreground mb-8">
            Search across multiple sources for comprehensive results
          </p>

          <form onSubmit={handleSubmit} className="relative">
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
                  placeholder="Search for anything..."
                  className="flex-1 h-14 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 mr-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
