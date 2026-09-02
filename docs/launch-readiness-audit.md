# Auditoria de pre-lancamento comercial

Gerado em: 2026-09-02T22:44:06.505Z

## Resumo

- Total: 47
- OK: 43
- Alertas: 4
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
| OK | env | COMPANY_LEGAL_NAME | high | Presente em .env.example. |
| OK | env | COMPANY_TAX_ID | high | Presente em .env.example. |
| OK | env | COMPANY_ADDRESS | high | Presente em .env.example. |
| WARN | env-local | .env.local completo | medium | Arquivo local protegido, mas faltam 12 chaves obrigatorias: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID, NEXT_PUBLIC_SITE_URL, COMPANY_LEGAL_NAME, COMPANY_TAX_ID, COMPANY_ADDRESS. |
| OK | build | script build | high | Script de build configurado. |
| OK | dependencies | baseline segura do Next.js | critical | Next.js ^16.3.0 com baseline de seguranca atualizada; o CI tambem executa npm audit. |
| OK | qa | QA responsivo automatizado | high | Quatro viewports concluiram tutorial/orientacao, partida, interacoes e tela final sem problemas detectados. |
| OK | analytics | tracking interno do funil | high | Cliente, API e tabela versionada de analytics interno devem existir para medir conversao. |
| OK | qa | auditoria de modos do player | high | Auditoria de modos do player esta configurada. |
| OK | local-auth | bypass local bloqueado em producao | critical | A rota local-test e o middleware devem depender de isLocalDevAuthAllowed com bloqueio explicito em producao. |
| OK | access-control | acessos especiais fora do codigo | critical | A lista de acessos gratuitos deve vir de configuracao segura e nao conter e-mails versionados. |
| OK | stripe | checkout autenticado | critical | Checkout exige usuario autenticado e valida IDs de preco. |
| OK | stripe | webhook assinado | critical | Webhook valida assinatura Stripe e usa service role apenas no servidor. |
| OK | stripe | portal autenticado | high | Portal exige usuario autenticado. |
| OK | qa | verificacao HTTP de release | high | O smoke test deve validar paginas publicas, protecao de rotas, checkout, webhook e respostas 404. |
| OK | seo | metadados e descoberta | medium | Manifesto, robots, sitemap, Open Graph e Twitter Card devem estar configurados. |
| OK | operations | endpoint de saude | high | O endpoint /api/health permite monitorar a disponibilidade sem autenticar. |
| OK | resilience | estados globais de erro e carregamento | high | A aplicacao deve oferecer recuperacao para erro, carregamento e pagina inexistente. |
| OK | privacy | cache e indexacao de areas privadas | high | APIs, login e dashboard nao devem ser armazenados por cache compartilhado nem indexados. |
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
| OK | legal | direitos autorais das musicas | critical | As 90 musicas possuem procedencia, licenca e atribuicao publicamente documentadas; o indice comercial nao usa capas externas. A verificacao tecnica nao substitui parecer juridico. |
| WARN | catalog | revisao auditiva final da biblioteca | critical | As 90 musicas possuem fonte canonica e fidelidade estrutural exata, mas a aprovacao por escuta humana de melodia, harmonia, andamento e experiencia das tres dificuldades continua obrigatoria antes da publicacao. |
| OK | brand | nome comercial consistente | high | Pianify e o nome comercial usado na documentacao e no produto. |
| OK | database | schema e migracoes reproduziveis | critical | Schema inicial e endurecimentos posteriores estao versionados em supabase/migrations. |
| WARN | business | teste de compra real | critical | Exige teste manual em producao/sandbox Stripe: checkout, webhook, portal, cancelamento, past_due e reativacao. |
| WARN | devices | teste em aparelhos fisicos | high | Exige teste manual em iPhone, Android, tablet, notebook e desktop, principalmente microfone, MIDI, audio e orientacao. |

## Leitura de negocio

Recomendado para beta pago controlado, mas ainda nao para campanha grande: existem pendencias criticas manuais.

