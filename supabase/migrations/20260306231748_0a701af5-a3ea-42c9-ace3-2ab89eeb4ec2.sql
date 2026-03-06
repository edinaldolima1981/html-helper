
-- Add investor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'investor';

-- Investors table - links user to investment data
CREATE TABLE public.investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invested_amount numeric NOT NULL DEFAULT 0,
  participation_percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage investors" ON public.investors FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Investors can view own data" ON public.investors FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text NOT NULL,
  product text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'geral',
  registered_by uuid REFERENCES auth.users(id),
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Investors can view expenses" ON public.expenses FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investors WHERE user_id = auth.uid())
);

-- Investor profit distributions (monthly)
CREATE TABLE public.investor_profits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  investor_share numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_profits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage profits" ON public.investor_profits FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Investors can view own profits" ON public.investor_profits FOR SELECT TO authenticated USING (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid())
);

-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit" ON public.audit_log FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Investors can view audit" ON public.audit_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investors WHERE user_id = auth.uid())
);

-- Storage bucket for expense documents
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-documents', 'expense-documents', true);

CREATE POLICY "Admins can upload docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'expense-documents' AND is_admin());
CREATE POLICY "Anyone auth can view docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'expense-documents');
CREATE POLICY "Admins can delete docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'expense-documents' AND is_admin());

-- Update triggers
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
