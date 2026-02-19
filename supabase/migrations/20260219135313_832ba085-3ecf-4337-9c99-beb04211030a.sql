
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Equipamento',
  type TEXT NOT NULL DEFAULT 'ONU',
  model TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  mac_address TEXT NOT NULL DEFAULT '',
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  signal_level NUMERIC,
  uptime TEXT,
  firmware TEXT,
  location TEXT,
  client_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view equipment" ON public.equipment FOR SELECT USING (is_authenticated_member());
CREATE POLICY "Members can insert equipment" ON public.equipment FOR INSERT WITH CHECK (is_authenticated_member());
CREATE POLICY "Members can update equipment" ON public.equipment FOR UPDATE USING (is_authenticated_member());
CREATE POLICY "Admins can delete equipment" ON public.equipment FOR DELETE USING (is_admin());

CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
