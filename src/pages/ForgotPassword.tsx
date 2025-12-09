import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary genie-glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-muted-foreground">
              {sent 
                ? 'Check your email for a reset link'
                : 'Enter your email and we\'ll send you a reset link'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                <p className="text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

              <Button type="submit" className="w-full genie-glow" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}