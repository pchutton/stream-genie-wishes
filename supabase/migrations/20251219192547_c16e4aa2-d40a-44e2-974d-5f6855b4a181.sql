-- Create streaming_mappings table for dynamic channel-to-platform mapping
CREATE TABLE public.streaming_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL UNIQUE,
  platforms TEXT[] NOT NULL,
  category TEXT DEFAULT 'general',
  is_verified BOOLEAN DEFAULT true,
  report_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.streaming_mappings ENABLE ROW LEVEL SECURITY;

-- Anyone can read streaming mappings (needed by edge function and frontend)
CREATE POLICY "Streaming mappings are publicly readable"
ON public.streaming_mappings
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_streaming_mappings_channel ON public.streaming_mappings(channel);
CREATE INDEX idx_streaming_mappings_verified ON public.streaming_mappings(is_verified);

-- Seed with current data (with corrections for NBA rights changes)
INSERT INTO public.streaming_mappings (channel, platforms, category, notes) VALUES
  ('ABC', ARRAY['Hulu + Live TV', 'YouTube TV', 'Fubo', 'DirecTV Stream'], 'broadcast', 'Major broadcast network'),
  ('ESPN', ARRAY['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'], 'sports', 'Primary ESPN channel'),
  ('ESPN2', ARRAY['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'], 'sports', 'ESPN secondary channel'),
  ('ESPNU', ARRAY['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'], 'college', 'College sports'),
  ('ESPNEWS', ARRAY['Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream', 'ESPN App'], 'sports', 'ESPN News channel'),
  ('ESPN+', ARRAY['ESPN+'], 'streaming', 'ESPN streaming service'),
  ('FOX', ARRAY['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'], 'broadcast', 'FOX broadcast'),
  ('FS1', ARRAY['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'], 'sports', 'Fox Sports 1'),
  ('FS2', ARRAY['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'], 'sports', 'Fox Sports 2'),
  ('Fox Sports', ARRAY['YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Blue'], 'sports', 'Fox Sports generic'),
  ('CBS', ARRAY['Paramount+', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'], 'broadcast', 'CBS broadcast'),
  ('CBS Sports Network', ARRAY['Paramount+', 'YouTube TV', 'Fubo', 'DirecTV Stream'], 'sports', 'CBS Sports Network'),
  ('NBC', ARRAY['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'], 'broadcast', 'NBC broadcast'),
  ('Peacock', ARRAY['Peacock'], 'streaming', 'NBCUniversal streaming'),
  ('Prime Video', ARRAY['Prime Video'], 'streaming', 'Amazon Prime Video'),
  ('Amazon Prime', ARRAY['Prime Video'], 'streaming', 'Amazon Prime Video alias'),
  -- UPDATED: TNT/TBS now without Max for NBA (rights moved to Prime Video/Peacock for 2025-26 season)
  ('TNT', ARRAY['YouTube TV', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Orange'], 'sports', 'Updated Dec 2025 - NBA rights moved to Prime Video/Peacock'),
  ('TBS', ARRAY['YouTube TV', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Orange'], 'sports', 'Updated Dec 2025 - NBA rights changes'),
  ('truTV', ARRAY['YouTube TV', 'Hulu + Live TV', 'DirecTV Stream', 'Sling Orange'], 'sports', 'March Madness coverage'),
  ('Max', ARRAY['Max'], 'streaming', 'Warner Bros Discovery streaming - no longer has live NBA'),
  ('NFL Network', ARRAY['YouTube TV', 'Fubo', 'Sling Blue', 'DirecTV Stream'], 'nfl', 'NFL dedicated network'),
  ('NBA TV', ARRAY['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'], 'nba', 'NBA dedicated network'),
  ('MLB Network', ARRAY['YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'], 'mlb', 'MLB dedicated network'),
  ('NHL Network', ARRAY['YouTube TV', 'Fubo', 'DirecTV Stream'], 'nhl', 'NHL dedicated network'),
  ('USA Network', ARRAY['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'], 'sports', 'USA Network'),
  ('SEC Network', ARRAY['ESPN+', 'Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'], 'college', 'SEC Conference'),
  ('SEC Network+', ARRAY['ESPN+', 'ESPN App'], 'college', 'SEC streaming overflow'),
  ('Big Ten Network', ARRAY['Peacock', 'YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream'], 'college', 'Big Ten Conference'),
  ('BTN', ARRAY['Peacock', 'YouTube TV', 'Fubo', 'Hulu + Live TV', 'DirecTV Stream'], 'college', 'Big Ten Network alias'),
  ('ACC Network', ARRAY['ESPN+', 'Hulu + Live TV', 'YouTube TV', 'Fubo', 'Sling Orange', 'DirecTV Stream'], 'college', 'ACC Conference'),
  ('ACC Network Extra', ARRAY['ESPN+', 'ESPN App'], 'college', 'ACC streaming overflow'),
  ('Longhorn Network', ARRAY['ESPN+', 'Sling Orange'], 'college', 'Texas Longhorns'),
  ('Big 12 Now', ARRAY['ESPN+'], 'college', 'Big 12 streaming'),
  ('PAC-12 Network', ARRAY['Fubo', 'Sling Orange'], 'college', 'PAC-12 Conference'),
  ('NBCSN', ARRAY['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'], 'sports', 'NBC Sports'),
  ('USA', ARRAY['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo', 'DirecTV Stream'], 'sports', 'USA Network alias'),
  ('Telemundo', ARRAY['Peacock', 'YouTube TV', 'Hulu + Live TV', 'Fubo'], 'broadcast', 'Spanish language'),
  ('Universo', ARRAY['YouTube TV', 'Fubo'], 'broadcast', 'Spanish language'),
  ('beIN Sports', ARRAY['Fubo', 'Sling Orange'], 'soccer', 'International soccer'),
  ('Apple TV', ARRAY['Apple TV+'], 'streaming', 'Apple streaming'),
  ('Apple TV+', ARRAY['Apple TV+'], 'streaming', 'Apple streaming service'),
  ('MLS Season Pass', ARRAY['Apple TV+'], 'soccer', 'MLS exclusive on Apple'),
  ('PPV', ARRAY['ESPN+ PPV', 'DAZN'], 'ppv', 'Pay-per-view events'),
  ('ESPN PPV', ARRAY['ESPN+ PPV'], 'ppv', 'ESPN pay-per-view'),
  ('DAZN', ARRAY['DAZN'], 'ppv', 'Boxing/combat sports streaming'),
  ('Showtime', ARRAY['Paramount+', 'YouTube TV', 'Fubo'], 'ppv', 'Boxing/premium content'),
  ('Tennis Channel', ARRAY['YouTube TV', 'Fubo', 'Sling Orange'], 'tennis', 'Tennis coverage'),
  ('Golf Channel', ARRAY['Peacock', 'YouTube TV', 'Fubo', 'Sling Blue'], 'golf', 'Golf coverage');

-- Create function to process content reports and update streaming mappings
CREATE OR REPLACE FUNCTION public.process_streaming_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reported_channel TEXT;
BEGIN
  -- Only process reports for live events with provider issues
  IF NEW.content_type = 'live_event' AND NEW.issue_type IN ('wrong_provider', 'missing_provider', 'other') THEN
    -- Extract the reported provider/channel
    reported_channel := COALESCE(NEW.reported_provider, '');
    
    IF reported_channel != '' THEN
      -- Update the streaming_mappings table
      UPDATE public.streaming_mappings
      SET 
        report_count = report_count + 1,
        is_verified = CASE WHEN report_count >= 4 THEN false ELSE is_verified END,
        last_updated = now()
      WHERE LOWER(channel) = LOWER(reported_channel)
         OR channel ILIKE '%' || reported_channel || '%';
      
      IF FOUND THEN
        RAISE NOTICE 'Updated streaming mapping for channel: %', reported_channel;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on content_reports
CREATE TRIGGER on_content_report_created
  AFTER INSERT ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.process_streaming_report();