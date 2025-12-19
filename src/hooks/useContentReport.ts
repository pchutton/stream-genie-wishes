import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export type IssueType = 'not_available' | 'missing_provider' | 'outdated' | 'other';
export type ContentType = 'movie' | 'tv' | 'live_event';

interface ReportData {
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
  reportedProvider?: string;
  issueType: IssueType;
  correctProvider?: string;
  additionalInfo?: string;
}

export function useContentReport() {
  const { user } = useAuth();

  const submitReport = useMutation({
    mutationFn: async (data: ReportData) => {
      // Get device/browser info
      const deviceInfo = `${navigator.userAgent.slice(0, 100)}`;
      
      // Try to get region (basic approach)
      const region = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { error } = await supabase.from('content_reports').insert({
        user_id: user?.id || null,
        content_type: data.contentType,
        content_id: data.contentId,
        content_title: data.contentTitle,
        reported_provider: data.reportedProvider || null,
        issue_type: data.issueType,
        correct_provider: data.correctProvider || null,
        additional_info: data.additionalInfo?.slice(0, 200) || null,
        region,
        device_info: deviceInfo,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Thank you! We\'ll review this report.');
    },
    onError: (error) => {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again.');
    },
  });

  return {
    submitReport: submitReport.mutate,
    isSubmitting: submitReport.isPending,
  };
}
