import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  push_subscription: PushSubscriptionJSON | null;
  notify_before_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data as NotificationPreferences | null);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to enable notifications',
        variant: 'destructive',
      });
      return false;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return false;

    try {
      // For now, we'll store the preference without a full push subscription
      // since that requires a VAPID key setup on the backend
      const prefData = {
        user_id: user.id,
        push_enabled: true,
        notify_before_minutes: 60,
      };

      if (preferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ push_enabled: true })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert(prefData);

        if (error) throw error;
      }

      toast({
        title: 'Notifications enabled',
        description: 'You\'ll receive alerts 1 hour before your favorite team\'s games',
      });

      await fetchPreferences();
      return true;
    } catch (err) {
      console.error('Error enabling push notifications:', err);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
      return false;
    }
  };

  const disablePushNotifications = async (): Promise<boolean> => {
    if (!user || !preferences) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ push_enabled: false, push_subscription: null })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Notifications disabled',
        description: 'You won\'t receive game alerts anymore',
      });

      await fetchPreferences();
      return true;
    } catch (err) {
      console.error('Error disabling push notifications:', err);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateNotifyBefore = async (minutes: number): Promise<boolean> => {
    if (!user) return false;

    try {
      if (preferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ notify_before_minutes: minutes })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            push_enabled: false,
            notify_before_minutes: minutes,
          });

        if (error) throw error;
      }

      await fetchPreferences();
      return true;
    } catch (err) {
      console.error('Error updating notify before:', err);
      return false;
    }
  };

  // Show a local notification (for testing/demo)
  const showTestNotification = () => {
    if (!isSupported || Notification.permission !== 'granted') {
      toast({
        title: 'Enable notifications first',
        description: 'Please enable push notifications to receive alerts',
        variant: 'destructive',
      });
      return;
    }

    new Notification('StreamGenie Game Alert', {
      body: 'Your favorite team plays in 1 hour!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'game-alert-test',
    });
  };

  return {
    preferences,
    isLoading,
    isSupported,
    enablePushNotifications,
    disablePushNotifications,
    updateNotifyBefore,
    showTestNotification,
    refetch: fetchPreferences,
  };
}
