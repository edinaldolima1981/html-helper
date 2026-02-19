
-- Add nickname column
ALTER TABLE public.clients ADD COLUMN nickname text;

-- Add coordinate columns
ALTER TABLE public.clients ADD COLUMN latitude numeric;
ALTER TABLE public.clients ADD COLUMN longitude numeric;

-- Remove plan column
ALTER TABLE public.clients DROP COLUMN IF EXISTS plan;
