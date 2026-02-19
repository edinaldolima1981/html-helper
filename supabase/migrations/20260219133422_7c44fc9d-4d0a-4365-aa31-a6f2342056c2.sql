
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'technician');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Dispositivo Desconhecido',
  mac_address TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'blocked', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- WiFi settings (single row)
CREATE TABLE public.wifi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ssid TEXT NOT NULL DEFAULT 'MinhaRede',
  password TEXT NOT NULL DEFAULT '12345678',
  channel INTEGER NOT NULL DEFAULT 6,
  band TEXT NOT NULL DEFAULT '2.4GHz',
  guest_ssid TEXT DEFAULT 'Visitante',
  guest_password TEXT DEFAULT '',
  guest_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wifi_settings ENABLE ROW LEVEL SECURITY;

-- System settings (single row)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_pin TEXT NOT NULL DEFAULT '0000',
  auto_block_unknown BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- WhatsApp messages (simulation)
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL DEFAULT 'system',
  content TEXT NOT NULL,
  is_command BOOLEAN NOT NULL DEFAULT false,
  command_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wifi_settings_updated_at BEFORE UPDATE ON public.wifi_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- User roles: admins manage, all authenticated read own
CREATE POLICY "Members can view own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin());

-- Devices: all members read, admins + technicians can update status
CREATE POLICY "Members can view devices" ON public.devices FOR SELECT USING (public.is_authenticated_member());
CREATE POLICY "Members can insert devices" ON public.devices FOR INSERT WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Members can update devices" ON public.devices FOR UPDATE USING (public.is_authenticated_member());
CREATE POLICY "Admins can delete devices" ON public.devices FOR DELETE USING (public.is_admin());

-- Activity log: all members can read and insert
CREATE POLICY "Members can view activity" ON public.activity_log FOR SELECT USING (public.is_authenticated_member());
CREATE POLICY "Members can insert activity" ON public.activity_log FOR INSERT WITH CHECK (public.is_authenticated_member());

-- WiFi settings: admins only
CREATE POLICY "Admins can view wifi" ON public.wifi_settings FOR SELECT USING (public.is_authenticated_member());
CREATE POLICY "Admins can update wifi" ON public.wifi_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert wifi" ON public.wifi_settings FOR INSERT WITH CHECK (public.is_admin());

-- System settings: admins only
CREATE POLICY "Admins can view system" ON public.system_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update system" ON public.system_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert system" ON public.system_settings FOR INSERT WITH CHECK (public.is_admin());

-- WhatsApp messages: all members
CREATE POLICY "Members can view messages" ON public.whatsapp_messages FOR SELECT USING (public.is_authenticated_member());
CREATE POLICY "Members can insert messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (public.is_authenticated_member());
CREATE POLICY "Admins can delete messages" ON public.whatsapp_messages FOR DELETE USING (public.is_admin());

-- Insert default settings rows
INSERT INTO public.wifi_settings (ssid, password, channel, band) VALUES ('MinhaRede', '12345678', 6, '2.4GHz');
INSERT INTO public.system_settings (security_pin, auto_block_unknown, notifications_enabled) VALUES ('0000', false, true);

-- Insert sample devices
INSERT INTO public.devices (name, mac_address, ip_address, status) VALUES
  ('iPhone de João', 'AA:BB:CC:DD:EE:01', '192.168.1.10', 'connected'),
  ('Notebook Ana', 'AA:BB:CC:DD:EE:02', '192.168.1.11', 'connected'),
  ('Smart TV Sala', 'AA:BB:CC:DD:EE:03', '192.168.1.12', 'connected'),
  ('Dispositivo Desconhecido', 'AA:BB:CC:DD:EE:04', '192.168.1.13', 'unknown'),
  ('Tablet Kids', 'AA:BB:CC:DD:EE:05', '192.168.1.14', 'blocked');
