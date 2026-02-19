
-- Tabela para controlar IPs atribuídos automaticamente por provisioning
CREATE TABLE public.provisioning_ips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  client_name text,
  ip_address text NOT NULL UNIQUE,
  subnet text NOT NULL DEFAULT '192.168.1.0/24',
  subnet_index integer NOT NULL DEFAULT 1,
  host_index integer NOT NULL,
  gateway text NOT NULL,
  dns text NOT NULL DEFAULT '8.8.8.8',
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  released_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true
);

-- Habilita RLS
ALTER TABLE public.provisioning_ips ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Members can view provisioning_ips"
  ON public.provisioning_ips FOR SELECT
  USING (is_authenticated_member());

CREATE POLICY "Members can insert provisioning_ips"
  ON public.provisioning_ips FOR INSERT
  WITH CHECK (is_authenticated_member());

CREATE POLICY "Members can update provisioning_ips"
  ON public.provisioning_ips FOR UPDATE
  USING (is_authenticated_member());

CREATE POLICY "Admins can delete provisioning_ips"
  ON public.provisioning_ips FOR DELETE
  USING (is_admin());

-- Função para obter próximo IP disponível
CREATE OR REPLACE FUNCTION public.get_next_provisioning_ip()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_subnet_index integer;
  max_host_index integer;
  next_subnet_index integer;
  next_host_index integer;
  next_ip text;
  next_gateway text;
  next_subnet text;
BEGIN
  -- Busca o maior índice de subnet e host em uso
  SELECT 
    COALESCE(MAX(subnet_index), 1),
    COALESCE(MAX(host_index) FILTER (WHERE subnet_index = (SELECT MAX(subnet_index) FROM provisioning_ips WHERE is_active = true)), 1)
  INTO max_subnet_index, max_host_index
  FROM provisioning_ips
  WHERE is_active = true;

  -- Próximo host dentro da faixa atual (máximo 253 hosts por /24)
  IF max_host_index < 253 THEN
    next_subnet_index := max_subnet_index;
    next_host_index := max_host_index + 1;
  ELSE
    -- Passa para a próxima faixa /24
    next_subnet_index := max_subnet_index + 1;
    next_host_index := 2; -- começa no .2 (o .1 é o gateway)
  END IF;

  -- Monta os valores
  -- Faixas: 192.168.1.x, 192.168.2.x, ..., 192.168.254.x
  -- Depois: 10.0.1.x, 10.0.2.x, etc.
  IF next_subnet_index <= 254 THEN
    next_gateway := '192.168.' || next_subnet_index::text || '.1';
    next_ip := '192.168.' || next_subnet_index::text || '.' || next_host_index::text;
    next_subnet := '192.168.' || next_subnet_index::text || '.0/24';
  ELSE
    -- Faixa 10.0.x.x quando 192.168.x.x esgota
    DECLARE
      overflow_index integer := next_subnet_index - 254;
    BEGIN
      next_gateway := '10.0.' || overflow_index::text || '.1';
      next_ip := '10.0.' || overflow_index::text || '.' || next_host_index::text;
      next_subnet := '10.0.' || overflow_index::text || '.0/24';
    END;
  END IF;

  RETURN json_build_object(
    'ip', next_ip,
    'gateway', next_gateway,
    'subnet', next_subnet,
    'subnet_index', next_subnet_index,
    'host_index', next_host_index,
    'mask', '255.255.255.0'
  );
END;
$$;
