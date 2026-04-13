# MyPetCare

PWA para gestão completa de saúde, rotina e cuidados de pets.

## Stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS v4
- **Backend (produção):** Supabase (auth + banco PostgreSQL)
- **Auth:** Magic Link sem senha via Resend (configurado no Supabase)
- **IA:** Groq (llama3-8b-8192)
- **Pagamento:** Hotmart (webhook)
- **Notificações Push:** Pusher Beams
- **Email:** Resend

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```
VITE_GROQ_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUSHER_INSTANCE_ID=
VITE_APP_URL=
HOTMART_WEBHOOK_SECRET=
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

```bash
npm run build
```

## Próximos passos para produção

1. Instalar `@supabase/supabase-js` e `@supabase/auth-helpers-react`
2. Substituir `isAuthenticated = true` em `App.tsx` pelo hook `useSession()` do Supabase
3. Criar endpoint `POST /api/webhook/hotmart` para ativar/desativar usuários
4. Configurar Pusher Beams para notificações push
5. Adicionar ícones PWA (`/public/icon-192.png`, `/public/icon-512.png`)
6. Configurar `vite-plugin-pwa` para service worker e cache offline
