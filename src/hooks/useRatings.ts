import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

type RatingType = 'like' | 'dislike' | null;

interface Rating {
  tmdb_id: number;
  media_type: string;
  rating: 'like' | 'dislike';
}

export function useRatings() {
  const [ratings, setRatings] = useState<Map<string, RatingType>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Create a key for the rating map
  const getRatingKey = (tmdbId: number, mediaType: string) => `${mediaType}-${tmdbId}`;

  // Fetch all ratings for the user
  useEffect(() => {
    if (!user) {
      setRatings(new Map());
      return;
    }

    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('tmdb_id, media_type, rating')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching ratings:', error);
        return;
      }

      const ratingsMap = new Map<string, RatingType>();
      data?.forEach((r: Rating) => {
        ratingsMap.set(getRatingKey(r.tmdb_id, r.media_type), r.rating);
      });
      setRatings(ratingsMap);
    };

    fetchRatings();
  }, [user]);

  // Get rating for a specific item
  const getRating = (tmdbId: number, mediaType: string): RatingType => {
    return ratings.get(getRatingKey(tmdbId, mediaType)) || null;
  };

  // Set rating for an item
  const setRating = async (tmdbId: number, mediaType: string, rating: RatingType) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to rate content',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const key = getRatingKey(tmdbId, mediaType);

    try {
      if (rating === null) {
        // Remove rating
        const { error } = await supabase
          .from('ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_id', tmdbId)
          .eq('media_type', mediaType);

        if (error) throw error;

        setRatings((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        // Upsert rating
        const { error } = await supabase
          .from('ratings')
          .upsert({
            user_id: user.id,
            tmdb_id: tmdbId,
            media_type: mediaType,
            rating: rating,
          }, {
            onConflict: 'user_id,tmdb_id,media_type',
          });

        if (error) throw error;

        setRatings((prev) => {
          const next = new Map(prev);
          next.set(key, rating);
          return next;
        });

        toast({
          title: rating === 'like' ? '👍 Liked!' : '👎 Disliked',
          description: 'Your rating has been saved',
        });
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rating',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getRating,
    setRating,
    isLoading,
  };
}
