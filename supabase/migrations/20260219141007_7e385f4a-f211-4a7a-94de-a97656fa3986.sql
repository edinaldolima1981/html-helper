
-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SP',
  cep TEXT,
  plan TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clients" ON public.clients FOR SELECT USING (is_authenticated_member());
CREATE POLICY "Members can insert clients" ON public.clients FOR INSERT WITH CHECK (is_authenticated_member());
CREATE POLICY "Members can update clients" ON public.clients FOR UPDATE USING (is_authenticated_member());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (is_admin());

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT 'Instalação',
  status TEXT NOT NULL DEFAULT 'pendente',
  assigned_to TEXT,
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view orders" ON public.service_orders FOR SELECT USING (is_authenticated_member());
CREATE POLICY "Members can insert orders" ON public.service_orders FOR INSERT WITH CHECK (is_authenticated_member());
CREATE POLICY "Members can update orders" ON public.service_orders FOR UPDATE USING (is_authenticated_member());
CREATE POLICY "Admins can delete orders" ON public.service_orders FOR DELETE USING (is_admin());

CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
