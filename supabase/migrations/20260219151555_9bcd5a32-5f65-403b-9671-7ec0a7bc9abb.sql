
-- Add credits column to clients
ALTER TABLE public.clients ADD COLUMN credits numeric NOT NULL DEFAULT 0;

-- Create credit transactions table
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  plan_name text NOT NULL,
  payment_method text NOT NULL DEFAULT 'pix',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view transactions" ON public.credit_transactions FOR SELECT USING (is_authenticated_member());
CREATE POLICY "Members can insert transactions" ON public.credit_transactions FOR INSERT WITH CHECK (is_authenticated_member());
CREATE POLICY "Members can update transactions" ON public.credit_transactions FOR UPDATE USING (is_authenticated_member());
CREATE POLICY "Admins can delete transactions" ON public.credit_transactions FOR DELETE USING (is_admin());
