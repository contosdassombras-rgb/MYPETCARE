-- Migração v4: Configurações de Sistema e Segurança Admin

-- 1. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão (Adaptado do modelo enviado)
INSERT INTO public.system_settings (key, value) VALUES 
('recovery_email', 'suporte.agenciagiant@gmail.com'),
('email_welcome_subject', 'Seu acesso MyPetCare está liberado! 🐾'),
('email_welcome_body', '<h1>MyPetCare</h1><p>Plataforma de Saúde e Cuidado Animal</p><p>Olá! Sua assinatura foi confirmada! Agora você tem acesso completo ao MyPetCare.</p><p><b>O que você pode fazer:</b></p><ul><li>Cadastrar seus pets e históricos de saúde</li><li>Gerenciar vacinas, medicamentos e agendamentos</li><li>Acompanhar sintomas e relatórios</li><li>Acessar de qualquer lugar pelo celular</li></ul><p>Acesse agora: <a href="https://app.vidacare.site">https://app.vidacare.site</a></p><p>Use o seu e-mail de compra para acessar.</p><p>Equipe MyPetCare</p>'),
('email_appointment_subject', 'Lembrete: Agendamento para amanhã! 📅'),
('email_appointment_body', 'Olá! Amanhã é dia de cuidar do seu pet. Você tem um agendamento marcado: {{eventTitle}} para o(a) {{petName}}. Até lá!'),
('push_appointment_body', 'Olá! Amanhã o {{petName}} tem um(a) {{eventTitle}} marcado. Não esqueça! 🐾')
ON CONFLICT (key) DO NOTHING;

-- 2. Garantir coluna email na tabela profiles (usada para login direto)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 3. Habilitar RLS e Políticas para Admin
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin pode TUDO em system_settings
CREATE POLICY "Admins have full access to system_settings" 
ON public.system_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para Admin ver TODOS os perfis (Conserta a base de usuários vazia)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para Admin ver TODOS os pets
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
CREATE POLICY "Admins can view all pets" 
ON public.pets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para Admin ver TODOS os eventos
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events" 
ON public.events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
