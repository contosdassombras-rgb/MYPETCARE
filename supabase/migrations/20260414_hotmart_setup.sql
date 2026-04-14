-- 1. Tabela de eventos da Hotmart para rastreio e KPIs
CREATE TABLE IF NOT EXISTS public.hotmart_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_name TEXT,
    transaction_id TEXT,
    product_id TEXT,
    price_value NUMERIC,
    price_currency TEXT,
    status TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para buscas rápidas por email (usado no webhook)
CREATE INDEX IF NOT EXISTS idx_hotmart_email ON public.hotmart_events(buyer_email);

-- 2. Atualização da tabela de perfis
-- Adiciona email se não existir (essencial para busca via webhook)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Adiciona last_login_at para o KPI "Nunca Acessaram"
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Habilitar RLS nas novas tabelas (Segurança)
ALTER TABLE public.hotmart_events ENABLE ROW LEVEL SECURITY;

-- Políticas para Admin ver os eventos
CREATE POLICY "Admins can view hotmart events" 
ON public.hotmart_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
