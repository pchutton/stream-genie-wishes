import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { LiveEvent, PlatformInfo } from './useLiveEventsSearch';
import type { Json } from '@/integrations/supabase/types';

export interface SavedEvent {
  id: string;
  user_id: string;
  event_name: string;
  event_time: string;
  participants: string | null;
  where_to_watch: string | null;
  link: string | null;
  summary: string | null;
  streaming_platforms: string[] | null;
  platform_details: PlatformInfo[] | null;
  created_at: string;
}

// Helper to convert DB row to SavedEvent
function mapDbRowToSavedEvent(row: {
  id: string;
  user_id: string;
  event_name: string;
  event_time: string;
  participants: string | null;
  where_to_watch: string | null;
  link: string | null;
  summary: string | null;
  streaming_platforms: string[] | null;
  platform_details: Json | null;
  created_at: string;
}): SavedEvent {
  return {
    ...row,
    platform_details: (row.platform_details as unknown) as PlatformInfo[] | null,
  };
}

export function useSavedEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSavedEvents = useCallback(async () => {
    if (!user) {
      setSavedEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedEvents((data || []).map(mapDbRowToSavedEvent));
    } catch (err) {
      console.error('Error fetching saved events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedEvents();
  }, [fetchSavedEvents]);

  const isEventSaved = useCallback((eventName: string): boolean => {
    return savedEvents.some(e => e.event_name === eventName);
  }, [savedEvents]);

  const saveEvent = async (event: LiveEvent) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save events',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_events')
        .insert([{
          user_id: user.id,
          event_name: event.eventName,
          event_time: event.time,
          participants: event.participants || null,
          where_to_watch: event.whereToWatch || null,
          link: event.link || null,
          summary: event.summary || null,
          streaming_platforms: event.streamingPlatforms || null,
          platform_details: (event.platformDetails || null) as unknown as Json,
        }]);

      if (error) throw error;

      toast({
        title: 'Event saved',
        description: 'Added to My Events',
      });

      await fetchSavedEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      toast({
        title: 'Failed to save',
        description: 'Could not save the event',
        variant: 'destructive',
      });
    }
  };

  const unsaveEvent = async (eventName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_name', eventName);

      if (error) throw error;

      toast({
        title: 'Event removed',
        description: 'Removed from My Events',
      });

      await fetchSavedEvents();
    } catch (err) {
      console.error('Error removing event:', err);
      toast({
        title: 'Failed to remove',
        description: 'Could not remove the event',
        variant: 'destructive',
      });
    }
  };

  const toggleSaveEvent = async (event: LiveEvent) => {
    if (isEventSaved(event.eventName)) {
      await unsaveEvent(event.eventName);
    } else {
      await saveEvent(event);
    }
  };

  return {
    savedEvents,
    isLoading,
    isEventSaved,
    saveEvent,
    unsaveEvent,
    toggleSaveEvent,
    refetch: fetchSavedEvents,
  };
}
