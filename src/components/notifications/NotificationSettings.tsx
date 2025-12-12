import { Bell, BellOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationSettings() {
  const {
    preferences,
    isLoading,
    isSupported,
    enablePushNotifications,
    disablePushNotifications,
    showTestNotification,
  } = useNotificationPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. Try using Chrome, Firefox, or Safari on a supported device.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isPushEnabled = preferences?.push_enabled ?? false;

  const handleToggle = async () => {
    if (isPushEnabled) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Game Alerts
        </CardTitle>
        <CardDescription>
          Get notified 1 hour before your favorite team's games start
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {isPushEnabled ? 'You\'ll receive game alerts' : 'Enable to get game reminders'}
            </p>
          </div>
          <Switch
            id="push-toggle"
            checked={isPushEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {isPushEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={showTestNotification}
            className="gap-2"
          >
            <TestTube className="w-4 h-4" />
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
