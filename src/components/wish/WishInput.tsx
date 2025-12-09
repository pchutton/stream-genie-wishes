import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWishUsage } from '@/hooks/useWishUsage';
import { cn } from '@/lib/utils';

interface WishInputProps {
  onSubmit: (mood: string) => void;
  isLoading?: boolean;
}

export function WishInput({ onSubmit, isLoading = false }: WishInputProps) {
  const [mood, setMood] = useState('');
  const { wishesRemaining, wishLimit, canMakeWish } = useWishUsage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mood.trim() && canMakeWish) {
      onSubmit(mood.trim());
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Tell us what you're in the mood to watch... (e.g., 'something funny with a good plot twist' or 'a feel-good movie for date night')"
            className="min-h-[120px] resize-none rounded-2xl border-2 border-border bg-card p-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading || !canMakeWish}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              {wishesRemaining} / {wishLimit} wishes remaining today
            </span>
          </div>

          <Button
            type="submit"
            disabled={!mood.trim() || isLoading || !canMakeWish}
            className={cn(
              'gap-2 rounded-xl px-6',
              canMakeWish && 'genie-glow animate-pulse-glow'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Making your wish...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Make a Wish
              </>
            )}
          </Button>
        </div>
      </form>

      {!canMakeWish && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="text-sm">
            You've used all your wishes for today.{' '}
            <a href="/pro" className="font-medium text-primary hover:underline">
              Upgrade to Pro
            </a>{' '}
            for more wishes!
          </p>
        </div>
      )}
    </div>
  );
}