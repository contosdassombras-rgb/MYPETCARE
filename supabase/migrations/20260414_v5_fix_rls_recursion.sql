-- Migração v5: Correção de Recursão RLS e Acesso Admin

-- 1. Criar função auxiliar para checar se é admin sem causar recursão infinita
-- SECURITY DEFINER faz a função rodar com permissões de dono (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar Políticas da tabela PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Política simples: cada um vê o seu
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Política para Admin: vê tudo (usando a função para evitar recursão)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin());

-- 3. Atualizar Políticas da tabela PETS
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can view their own pets" ON public.pets;

CREATE POLICY "Users can view own pets" 
ON public.pets FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all pets" 
ON public.pets FOR SELECT 
USING (public.is_admin());

-- 4. Atualizar Políticas da tabela EVENTS
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

CREATE POLICY "Users can view own events" 
ON public.events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pets 
    WHERE pets.id = events.pet_id AND pets.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all events" 
ON public.events FOR SELECT 
USING (public.is_admin());
