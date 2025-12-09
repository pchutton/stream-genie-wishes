-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  preferred_watch_time TIME,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  release_year INTEGER,
  genres TEXT[],
  streaming_platforms TEXT[],
  is_watched BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watched_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Enable RLS on watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist"
ON public.watchlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist"
ON public.watchlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist"
ON public.watchlist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
ON public.watchlist FOR DELETE
USING (auth.uid() = user_id);

-- Create wish_usage table to track daily wishes
CREATE TABLE public.wish_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  wish_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS on wish_usage
ALTER TABLE public.wish_usage ENABLE ROW LEVEL SECURITY;

-- Wish usage policies
CREATE POLICY "Users can view their own wish usage"
ON public.wish_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wish usage"
ON public.wish_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wish usage"
ON public.wish_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wish_usage_updated_at
  BEFORE UPDATE ON public.wish_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();