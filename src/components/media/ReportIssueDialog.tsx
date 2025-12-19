import { useState } from 'react';
import { Flag, AlertTriangle, Plus, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useContentReport, IssueType, ContentType } from '@/hooks/useContentReport';
import { cn } from '@/lib/utils';

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
  reportedProvider?: string; // Pre-fill if reporting a specific provider
  providers?: string[]; // List of current providers for context
}

const issueOptions: { value: IssueType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'not_available',
    label: 'Not available on this service',
    description: 'The content isn\'t actually on this platform',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    value: 'missing_provider',
    label: 'Missing a provider',
    description: 'A streaming service that has this content isn\'t listed',
    icon: <Plus className="h-4 w-4" />,
  },
  {
    value: 'outdated',
    label: 'Outdated information',
    description: 'The details shown are no longer accurate',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: 'other',
    label: 'Other issue',
    description: 'Something else is wrong',
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

export function ReportIssueDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  reportedProvider,
  providers = [],
}: ReportIssueDialogProps) {
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [correctProvider, setCorrectProvider] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const { submitReport, isSubmitting } = useContentReport();

  const handleSubmit = () => {
    if (!issueType) return;

    submitReport({
      contentType,
      contentId,
      contentTitle,
      reportedProvider,
      issueType,
      correctProvider: correctProvider.trim() || undefined,
      additionalInfo: additionalInfo.trim() || undefined,
    });

    // Reset and close
    setIssueType('');
    setCorrectProvider('');
    setAdditionalInfo('');
    onOpenChange(false);
  };

  const showCorrectProviderInput = issueType === 'missing_provider';
  const showAdditionalInfo = issueType !== '';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-zinc-800 border-zinc-700">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-zinc-600" />
        
        <div className="overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0 pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Flag className="h-5 w-5" />
              <DrawerTitle className="text-lg">Report an Issue</DrawerTitle>
            </div>
            <DrawerDescription className="text-left text-sm">
              Help us improve by reporting incorrect streaming info for:
              <span className="block mt-1 font-medium text-foreground">{contentTitle}</span>
              {reportedProvider && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Provider: {reportedProvider}
                </span>
              )}
            </DrawerDescription>
          </DrawerHeader>

          {/* Issue Type Selection */}
          <div className="mt-4">
            <Label className="text-sm font-medium text-foreground mb-3 block">
              What's wrong?
            </Label>
            <RadioGroup
              value={issueType}
              onValueChange={(value) => setIssueType(value as IssueType)}
              className="space-y-2"
            >
              {issueOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    issueType === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Correct Provider Input */}
          {showCorrectProviderInput && (
            <div className="mt-4">
              <Label htmlFor="correct-provider" className="text-sm font-medium">
                Which provider is missing? (optional)
              </Label>
              <Input
                id="correct-provider"
                placeholder="e.g., Prime Video, Peacock"
                value={correctProvider}
                onChange={(e) => setCorrectProvider(e.target.value)}
                className="mt-2 bg-zinc-900 border-zinc-700"
                maxLength={50}
              />
            </div>
          )}

          {/* Additional Info */}
          {showAdditionalInfo && (
            <div className="mt-4">
              <Label htmlFor="additional-info" className="text-sm font-medium">
                Additional details (optional)
              </Label>
              <Textarea
                id="additional-info"
                placeholder="Any other helpful info..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="mt-2 bg-zinc-900 border-zinc-700 min-h-[80px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {additionalInfo.length}/200
              </p>
            </div>
          )}

          {/* Current Providers Context */}
          {providers.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Currently listed: {providers.slice(0, 5).join(', ')}
                {providers.length > 5 && ` +${providers.length - 5} more`}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!issueType || isSubmitting}
            className="w-full mt-6 h-11 genie-glow"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Small trigger button to use next to providers
export function ReportIssueButton({
  onClick,
  variant = 'icon',
  className,
}: {
  onClick: () => void;
  variant?: 'icon' | 'text';
  className?: string;
}) {
  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          className
        )}
        title="Report incorrect info"
        aria-label="Report incorrect streaming information"
      >
        <Flag className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors',
        'focus:outline-none focus:underline',
        className
      )}
    >
      <Flag className="h-3 w-3" />
      <span>Wrong info?</span>
    </button>
  );
}
