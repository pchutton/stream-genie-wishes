import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useProfile } from './useProfile';

const FREE_WISH_LIMIT = 5;
const PRO_WISH_LIMIT = 50;

export function useWishUsage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const today = new Date().toISOString().split('T')[0];
  const wishLimit = profile?.subscription_status === 'pro' ? PRO_WISH_LIMIT : FREE_WISH_LIMIT;

  const { data: usage, ...rest } = useQuery({
    queryKey: ['wish-usage', user?.id, today],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('wish_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const wishesUsed = usage?.wish_count ?? 0;
  const wishesRemaining = Math.max(0, wishLimit - wishesUsed);
  const canMakeWish = wishesRemaining > 0;

  return {
    ...rest,
    data: usage,
    wishesUsed,
    wishesRemaining,
    wishLimit,
    canMakeWish,
  };
}

export function useIncrementWishUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Try to get existing record
      const { data: existing } = await supabase
        .from('wish_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('wish_usage')
          .update({ wish_count: existing.wish_count + 1 })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('wish_usage')
          .insert({
            user_id: user.id,
            usage_date: today,
            wish_count: 1,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wish-usage', user?.id, today] });
    },
  });
}