-- Harden the handle_new_user function with better validation and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Validate that we have a valid user ID
  IF new.id IS NULL THEN
    RAISE EXCEPTION 'Cannot create profile: user ID is null';
  END IF;
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists, this is fine (idempotent)
      RAISE NOTICE 'Profile already exists for user %', new.id;
    WHEN OTHERS THEN
      -- Log and re-raise other errors
      RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
      RAISE;
  END;
  
  RETURN new;
END;
$$;