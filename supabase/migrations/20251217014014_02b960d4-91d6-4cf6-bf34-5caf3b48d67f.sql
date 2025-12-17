-- Drop the existing constraint that only checks user_id and team_name
ALTER TABLE public.favorite_teams DROP CONSTRAINT favorite_teams_user_id_team_name_key;

-- Add new constraint that includes league, allowing same team name in different leagues
ALTER TABLE public.favorite_teams ADD CONSTRAINT favorite_teams_user_id_team_name_league_key UNIQUE (user_id, team_name, league);