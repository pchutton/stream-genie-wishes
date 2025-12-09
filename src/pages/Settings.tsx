import { useState } from 'react';
import { User, Clock, CreditCard, Save, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

function SettingsContent() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Initialize form values when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPreferredTime(profile.preferred_watch_time || '');
    }
  });

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        preferred_watch_time: preferredTime || null,
      });
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Watch Time Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferred Watch Time
          </CardTitle>
          <CardDescription>When do you usually watch TV? We'll remind you at this time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="watchTime">Watch Time</Label>
            <Input
              id="watchTime"
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              You'll see a reminder to make a wish at this time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={profile?.subscription_status === 'pro' ? 'default' : 'secondary'}>
                {profile?.subscription_status === 'pro' ? 'Pro' : 'Free'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {profile?.subscription_status === 'pro'
                  ? '50 wishes/day • Unlimited watchlist'
                  : '5 wishes/day • 20 items watchlist'}
              </span>
            </div>
            {profile?.subscription_status !== 'pro' && (
              <Link to="/pro">
                <Button variant="outline" size="sm" className="gap-2">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2 genie-glow">
        {updateProfile.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <SettingsContent />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}