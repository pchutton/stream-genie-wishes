import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlatformInfo {
  name: string;
  status: string; // "Included", "Included with provider login", "Rent: $X.XX", etc.
}

export interface LiveEvent {
  eventName: string;
  time: string;
  participants: string;
  whereToWatch: string;
  link: string;
  summary: string;
  streamingPlatforms?: string[];
  platformDetails?: PlatformInfo[];
}

export function useLiveEventsSearch() {
  const [results, setResults] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-live-events', {
        body: { query }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }
 
      if (data.error) {
        throw new Error(data.error);
      }
 
      setResults(data.events || []);
 
      if (data.events?.length === 0) {
        if (data.quotaExceeded) {
          toast({
            title: 'Search limited today',
            description:
              data.message ||
              'Our main search provider hit a daily limit. We could not find any upcoming events for this query.',
          });
        } else {
          toast({
            title: 'No events found',
            description: 'Try a different search term',
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search live events';
      setError(message);
      toast({
        title: 'Search failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return { results, isLoading, error, search, clearResults };
}
