import { useState } from 'react';
import { User, Loader2, LogOut, UserPlus, Mail, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

function CreateAccountForm() {
  const { linkAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const { error } = await linkAccount(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Your data has been preserved.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Account
        </CardTitle>
        <CardDescription>
          Create an account to sync your data across devices and never lose your saved events and watchlist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Create Account & Save My Data
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SettingsContent() {
  const { user, isAnonymous, signOut } = useAuth();
  const { isLoading } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show create account form for anonymous users
  if (isAnonymous) {
    return (
      <div className="space-y-6">
        <CreateAccountForm />
        
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You're currently using StreamGenie without an account. Your saved events and watchlist are stored on this device. Create an account to sync across all your devices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show account info for logged-in users
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="destructive" 
        onClick={handleSignOut} 
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}

export default function Settings() {
  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <SettingsContent />
      </div>
    </Layout>
  );
}
