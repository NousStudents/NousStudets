-- Add unique constraint to school_name in schools table
ALTER TABLE public.schools
ADD CONSTRAINT schools_school_name_unique UNIQUE (school_name);