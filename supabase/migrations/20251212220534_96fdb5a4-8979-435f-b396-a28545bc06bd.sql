-- Create saved_events table for storing user's saved live events
CREATE TABLE public.saved_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_time TEXT NOT NULL,
  participants TEXT,
  where_to_watch TEXT,
  link TEXT,
  summary TEXT,
  streaming_platforms TEXT[],
  platform_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved events" 
ON public.saved_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own events" 
ON public.saved_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved events" 
ON public.saved_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX idx_saved_events_event_name ON public.saved_events(event_name);