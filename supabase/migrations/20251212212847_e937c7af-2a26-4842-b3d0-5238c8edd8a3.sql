-- Create enum for sports leagues
CREATE TYPE public.sport_league AS ENUM ('NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'NCAAF', 'NCAAB');

-- Create favorite_teams table
CREATE TABLE public.favorite_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_name TEXT NOT NULL,
  league sport_league NOT NULL,
  espn_team_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_name)
);

-- Enable Row Level Security
ALTER TABLE public.favorite_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorite teams"
ON public.favorite_teams
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorite teams"
ON public.favorite_teams
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite teams"
ON public.favorite_teams
FOR DELETE
USING (auth.uid() = user_id);