-- ==========================================
-- MASTER SQL FIX: RESOLVENDO RECURSÃO RLS
-- ==========================================
-- Este script remove todas as políticas problemáticas e implementa
-- o acesso administrativo de alta performance para todas as tabelas.

-- 1. FUNÇÃO DE SEGURANÇA (Evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica a role diretamente no profiles ignorando o RLS atual
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS (profiles)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- 3. NOVAS POLÍTICAS (profiles)
CREATE POLICY "profiles_select_owner" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_update_owner" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());

-- 4. LIMPEZA E NOVAS POLÍTICAS (hotmart_events)
ALTER TABLE public.hotmart_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view hotmart events" ON public.hotmart_events;
CREATE POLICY "hotmart_select_admin" ON public.hotmart_events FOR SELECT USING (public.is_admin());

-- 5. LIMPEZA E NOVAS POLÍTICAS (system_settings)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to system_settings" ON public.system_settings;
CREATE POLICY "settings_all_admin" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "settings_select_public" ON public.system_settings FOR SELECT USING (true); -- Permitir leitura pública de chaves não sensíveis se necessário

-- 6. LIMPEZA E NOVAS POLÍTICAS (pets)
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can view their own pets" ON public.pets;

CREATE POLICY "pets_select_owner" ON public.pets FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "pets_select_admin" ON public.pets FOR SELECT USING (public.is_admin());
CREATE POLICY "pets_all_admin" ON public.pets FOR ALL USING (public.is_admin());

-- 7. LIMPEZA E NOVAS POLÍTICAS (events)
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

CREATE POLICY "events_select_owner" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pets WHERE pets.id = events.pet_id AND pets.owner_id = auth.uid())
);
CREATE POLICY "events_select_admin" ON public.events FOR SELECT USING (public.is_admin());
CREATE POLICY "events_all_admin" ON public.events FOR ALL USING (public.is_admin());

-- 8. GARANTIR COLUNAS NECESSÁRIAS PARA O DASHBOARD
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;
