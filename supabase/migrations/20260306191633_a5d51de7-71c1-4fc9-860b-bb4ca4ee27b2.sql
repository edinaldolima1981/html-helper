
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  features text[] NOT NULL DEFAULT '{}',
  subscribers integer NOT NULL DEFAULT 0,
  popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view plans" ON public.plans FOR SELECT TO authenticated USING (is_authenticated_member());
CREATE POLICY "Admins can insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update plans" ON public.plans FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete plans" ON public.plans FOR DELETE TO authenticated USING (is_admin());

INSERT INTO public.plans (name, subtitle, price, features, popular, sort_order) VALUES
  ('Básico', '1 dispositivo', 19.90, ARRAY['Mudar nome da rede WiFi','Mudar senha WiFi','1 dispositivo MikroTik','Suporte por WhatsApp'], false, 1),
  ('Pro', '3 dispositivos', 22.90, ARRAY['Tudo do Básico','Bloquear/desbloquear clientes por MAC','Listar clientes conectados','3 dispositivos MikroTik','Relatórios básicos'], true, 2),
  ('Master', '10 dispositivos', 29.90, ARRAY['Tudo do Pro','Gerar QR Code para WiFi','Criar redes temporárias (guest)','Conexão por tempo limitado','10 dispositivos MikroTik','Relatórios avançados','Suporte prioritário'], false, 3);
