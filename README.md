# 🎹 Pianify

> Aprenda piano e teclado de forma gamificada. Use o teclado do computador, o microfone ou conecte um instrumento MIDI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss)

## Estado do projeto

O Pianify está em preparação para lançamento. A aplicação já possui biblioteca musical, motor de prática gamificado, autenticação com Supabase, assinaturas via Stripe, controle de acesso no servidor, comissões transacionais e exportação de dados da conta. Antes de publicar em produção, ainda é necessário aplicar e validar as migrações em staging, configurar os serviços externos e concluir os testes manuais descritos no [`docs/production-launch-runbook.md`](docs/production-launch-runbook.md).

Nesta primeira versão, o cadastro é exclusivo para maiores de 18 anos e os recursos sociais permanecem desativados. Isso evita lançar mensagens e perfis públicos antes de existir consentimento verificável de responsável, denúncia e moderação adequados.

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 16 (App Router) | Aplicação web full-stack |
| React 19 e TypeScript | Interface e tipagem |
| Tailwind CSS e Framer Motion | Design e animações |
| Supabase | Autenticação e banco de dados |
| Stripe | Pagamentos e assinaturas |
| WebMIDI e Web Audio | Entrada e reprodução musical |
| Vercel | Hospedagem prevista |

## Executar localmente

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Sem credenciais externas, as páginas públicas funcionam em modo degradado e o login real permanece indisponível.

Para experimentar localmente sem Supabase, use o botão de acesso local exibido na tela de login. Esse recurso só funciona em desenvolvimento.

## Variáveis de ambiente

Use [`.env.example`](.env.example) como referência. Nunca envie `.env.local` ou chaves secretas ao Git.

| Variável | Finalidade |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública/anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações protegidas no servidor |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Chave pública do Cloudflare Turnstile |
| `SPECIAL_ACCESS_IDS` | IDs autorizados, separados por vírgula |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Assinatura do webhook Stripe |
| `STRIPE_MONTHLY_PRICE_ID` | Price ID do plano mensal |
| `STRIPE_YEARLY_PRICE_ID` | Price ID do plano anual |
| `NEXT_PUBLIC_BASE_URL` | URL canônica da aplicação |
| `NEXT_PUBLIC_SITE_URL` | URL pública usada em redirecionamentos |
| `NEXT_PUBLIC_SOCIAL_FEATURES_ENABLED` | Deve permanecer `false` no primeiro lançamento |
| `NEXT_PUBLIC_SHOW_VERIFIED_TESTIMONIALS` | Só use `true` com depoimentos reais e autorizados |
| `COMPANY_LEGAL_NAME` | Nome completo da pessoa física ou razão social exibida nos documentos legais |
| `COMPANY_TAX_ID` | Identificação com prefixo, por exemplo `CPF: ...` ou `CNPJ: ...` |
| `COMPANY_ADDRESS` | Endereço físico de atendimento exibido nos documentos legais |

## Teclado MIDI

1. Conecte o instrumento MIDI via USB.
2. Abra o Pianify no Chrome ou Edge.
3. Entre em uma música ou prática livre.
4. Autorize o acesso MIDI quando o navegador solicitar.

O suporte a WebMIDI varia por navegador e dispositivo. O microfone também exige HTTPS em produção e permissão explícita do usuário.

## Qualidade e auditorias

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
npm run audit-song-library
npm run audit-player-modes
npm run audit-song-source-fidelity
npm run audit-launch-readiness
```

Os relatórios gerados ficam em [`docs/`](docs/).

## Stripe em desenvolvimento

Com o Stripe CLI autenticado, encaminhe eventos para a aplicação:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie apenas o segredo `whsec_...` fornecido pela sessão para `STRIPE_WEBHOOK_SECRET` no seu `.env.local`. Use chaves e produtos de teste até que todo o fluxo de compra, renovação, cancelamento e falha de pagamento esteja validado.

## Banco de dados

As migrações versionadas ficam em [`supabase/migrations/`](supabase/migrations/). Elas incluem o schema inicial, endurecimento de assinaturas e saques, ledger financeiro, proteção das sessões de prática, desativação dos recursos sociais e consentimento adulto. Não aplique migrações diretamente em produção: revise o diff, confirme o backup e valide primeiro em um projeto de staging.

O passo a passo de banco, Stripe, Vercel, testes manuais, monitoramento e decisão de lançamento está no [`docs/production-launch-runbook.md`](docs/production-launch-runbook.md).

## Licença

Projeto privado. Todos os direitos reservados.
