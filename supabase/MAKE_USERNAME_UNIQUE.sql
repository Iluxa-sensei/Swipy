-- Make username unique and required in profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Ensure username is not empty if set
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3);

-- Update startups slug to be unique per owner (already exists but ensuring)
-- The existing index startups_owner_slug_unique is:
-- CREATE UNIQUE INDEX startups_owner_slug_unique ON public.startups(owner_id, coalesce(nullif(slug,''), name));
-- This is good.

