import { Sparkles, Check, Zap, Infinity } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '5 AI Wishes per day',
      'Up to 20 items in watchlist',
      'Search movies & TV shows',
      'Basic streaming info',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    features: [
      '50 AI Wishes per day',
      'Unlimited watchlist',
      'Priority AI recommendations',
      'All streaming platforms',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
];

function ProContent() {
  const { data: profile } = useProfile();
  const isPro = profile?.subscription_status === 'pro';

  const handleUpgrade = async () => {
    // TODO: Implement Stripe checkout
    console.log('Upgrade to Pro clicked');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary genie-glow">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Upgrade Your Experience</h1>
        <p className="text-muted-foreground">Get more wishes and unlimited watchlist access</p>
      </div>

      {/* Plans */}
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrentPlan = 
            (plan.name === 'Free' && !isPro) || 
            (plan.name === 'Pro' && isPro);

          return (
            <Card
              key={plan.name}
              className={cn(
                'relative overflow-hidden transition-all',
                plan.popular && 'ring-2 ring-primary'
              )}
            >
              {plan.popular && (
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.name === 'Pro' && <Zap className="h-5 w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={plan.name === 'Pro' && !isPro ? handleUpgrade : undefined}
                  disabled={isCurrentPlan}
                  variant={plan.popular ? 'default' : 'outline'}
                  className={cn('w-full', plan.popular && 'genie-glow')}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features comparison */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-center text-lg font-semibold">Why Go Pro?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">More Wishes</h3>
              <p className="text-sm text-muted-foreground">
                Get 50 AI-powered recommendations per day instead of 5
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Infinity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Unlimited Watchlist</h3>
              <p className="text-sm text-muted-foreground">
                Save as many movies and shows as you want
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pro() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ProContent />
      </div>
    </Layout>
  );
}