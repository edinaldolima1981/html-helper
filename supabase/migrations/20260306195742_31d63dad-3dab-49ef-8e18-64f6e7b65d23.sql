
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS initial_password text DEFAULT null;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teste';
