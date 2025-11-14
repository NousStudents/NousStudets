-- Fix the permissions column to handle NULL and set proper default
ALTER TABLE public.admins 
ALTER COLUMN permissions SET DEFAULT '[]'::jsonb,
ALTER COLUMN permissions DROP NOT NULL;

-- Update any existing NULL values to empty array
UPDATE public.admins 
SET permissions = '[]'::jsonb 
WHERE permissions IS NULL;