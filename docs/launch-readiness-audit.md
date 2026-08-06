# Auditoria de pre-lancamento comercial

Gerado em: 2026-08-06T06:40:18.172Z

## Resumo

- Total: 38
- OK: 35
- Alertas: 3
- Falhas: 0
- Pendencias criticas abertas: 2

## Checks

| Status | Categoria | Item | Severidade | Detalhes |
| --- | --- | --- | --- | --- |
| OK | env | NEXT_PUBLIC_SUPABASE_URL | high | Presente em .env.example. |
| OK | env | NEXT_PUBLIC_SUPABASE_ANON_KEY | high | Presente em .env.example. |
| OK | env | SUPABASE_SERVICE_ROLE_KEY | high | Presente em .env.example. |
| OK | env | NEXT_PUBLIC_TURNSTILE_SITE_KEY | high | Presente em .env.example. |
| OK | env | STRIPE_SECRET_KEY | high | Presente em .env.example. |
| OK | env | STRIPE_WEBHOOK_SECRET | high | Presente em .env.example. |
| OK | env | STRIPE_MONTHLY_PRICE_ID | high | Presente em .env.example. |
| OK | env | STRIPE_YEARLY_PRICE_ID | high | Presente em .env.example. |
| OK | env | NEXT_PUBLIC_SITE_URL | high | Presente em .env.example. |
| OK | env-local | .env.local completo | medium | Arquivo local encontrado com todas as 9 chaves obrigatorias. Valores nao sao expostos no relatorio. |
| OK | build | script build | high | Script de build configurado. |
| OK | dependencies | baseline segura do Next.js | critical | Next.js ^16.3.0 com baseline de seguranca atualizada; o CI tambem executa npm audit. |
| OK | qa | QA responsivo automatizado | high | Script de QA responsivo/interativo existe. |
| OK | analytics | tracking interno do funil | high | Cliente, API e tabela versionada de analytics interno devem existir para medir conversao. |
| OK | qa | auditoria de modos do player | high | Auditoria de modos do player esta configurada. |
| OK | local-auth | bypass local bloqueado em producao | critical | A rota local-test e o middleware devem depender de isLocalDevAuthAllowed com bloqueio explicito em producao. |
| OK | access-control | acessos especiais fora do codigo | critical | A lista de acessos gratuitos deve vir de configuracao segura e nao conter e-mails versionados. |
| OK | stripe | checkout autenticado | critical | Checkout exige usuario autenticado e valida IDs de preco. |
| OK | stripe | webhook assinado | critical | Webhook valida assinatura Stripe e usa service role apenas no servidor. |
| OK | stripe | portal autenticado | high | Portal exige usuario autenticado. |
| OK | stripe | webhook solicita nova tentativa quando o banco falha | critical | Falhas de persistencia precisam retornar 5xx para o Stripe reenviar o evento. |
| OK | admin-api | src/app/api/admin/analytics/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/expenses/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/financial/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/readiness/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/stats/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/teachers/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | admin-api | src/app/api/admin/withdrawals/route.ts | critical | Rota admin deve bloquear usuarios sem role admin. |
| OK | teacher-api | saques de professores | critical | Saque valida role, saldo disponivel, reservas pendentes e unicidade no banco. |
| OK | admin-api | atualizacao idempotente de saques | critical | O total pago deve ser recalculado a partir dos saques, sem somar novamente a cada clique. |
| OK | privacy | analytics sem IP bruto | high | O funil nao precisa persistir o endereco IP do visitante. |
| OK | security-headers | headers de seguranca | medium | Headers basicos de seguranca configurados no Next. |
| OK | catalog | biblioteca carregavel | high | 90 arquivos de musica encontrados e indice publico existe. |
| WARN | legal | direitos autorais das musicas | critical | Revisao juridica/manual ainda e necessaria antes de anunciar em escala. A auditoria tecnica nao comprova licenca comercial de melodias, arranjos, imagens ou marcas. |
| OK | brand | nome comercial consistente | high | Pianify e o nome comercial usado na documentacao e no produto. |
| OK | database | schema e migracoes reproduziveis | critical | Schema inicial e endurecimentos posteriores estao versionados em supabase/migrations. |
| WARN | business | teste de compra real | critical | Exige teste manual em producao/sandbox Stripe: checkout, webhook, portal, cancelamento, past_due e reativacao. |
| WARN | devices | teste em aparelhos fisicos | high | Exige teste manual em iPhone, Android, tablet, notebook e desktop, principalmente microfone, MIDI, audio e orientacao. |

## Leitura de negocio

Recomendado para beta pago controlado, mas ainda nao para campanha grande: existem pendencias criticas manuais.

