-- Create table for content error reports
CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_type TEXT NOT NULL, -- 'movie', 'tv', 'live_event'
  content_id TEXT NOT NULL, -- TMDB ID or event identifier
  content_title TEXT NOT NULL,
  reported_provider TEXT, -- Which provider was flagged
  issue_type TEXT NOT NULL, -- 'not_available', 'missing_provider', 'outdated', 'other'
  correct_provider TEXT, -- User-suggested correction
  additional_info TEXT, -- Optional notes (max 200 chars)
  region TEXT, -- User's region for sports rights
  device_info TEXT, -- Browser/device info
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit reports (including anonymous users)
CREATE POLICY "Anyone can create reports"
ON public.content_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.content_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();