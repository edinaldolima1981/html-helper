
-- Table to store MikroTik router connection configurations
CREATE TABLE public.mikrotik_routers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Router',
  ip_address text NOT NULL,
  port integer NOT NULL DEFAULT 8728,
  username text NOT NULL DEFAULT 'admin',
  password text NOT NULL DEFAULT '',
  api_type text NOT NULL DEFAULT 'rest',
  status text NOT NULL DEFAULT 'offline',
  last_seen_at timestamp with time zone,
  firmware_version text,
  model text,
  serial_number text,
  uptime text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mikrotik_routers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage routers
CREATE POLICY "Admins can manage routers" ON public.mikrotik_routers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members can view routers
CREATE POLICY "Members can view routers" ON public.mikrotik_routers
  FOR SELECT TO authenticated
  USING (public.is_authenticated_member());
