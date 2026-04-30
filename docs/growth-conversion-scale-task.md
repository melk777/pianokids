# Task - Escala, conversao e crescimento comercial

Objetivo: deixar o Pianify preparado para vender com mais conversao, medir todo o funil, reter alunos e escalar campanhas com seguranca.

## Fase 1 - Medicao do funil

Status: implementado parcialmente.

Objetivos:

- Registrar eventos essenciais do funil sem depender inicialmente de ferramenta externa.
- Permitir evoluir depois para GA4, Meta Pixel, PostHog ou outra plataforma.
- Medir visitante, cadastro, login, biblioteca, escolha de musica, inicio da aula, conclusao, checkout e assinatura.

Eventos alvo:

- `landing_view`
- `pricing_view`
- `checkout_started`
- `checkout_redirected`
- `auth_login_started`
- `auth_login_completed`
- `auth_signup_started`
- `auth_signup_completed`
- `onboarding_completed`
- `library_view`
- `song_card_opened`
- `song_locked_clicked`
- `song_started`
- `tutorial_completed`
- `song_finished`
- `score_restart_clicked`
- `recommended_practice_clicked`

Critérios de pronto:

- API local de tracking criada: `src/app/api/analytics/event/route.ts`.
- Cliente de tracking criado: `src/lib/analytics.ts`.
- Eventos principais conectados na landing, login, biblioteca, modal de musica, player e tela final.
- Documentacao SQL criada em `docs/analytics-events.sql`.
- Auditoria de pre-lancamento cobre a existencia da camada de analytics.

Pendencia externa:

- Rodar `docs/analytics-events.sql` no Supabase para persistir os eventos em producao.

## Fase 2 - Oferta comercial e conversao

Status: implementado parcialmente.

Objetivos:

- Melhorar hero, prova visual, proposta de valor, garantia, comparacao de planos e CTA.
- Reduzir atrito entre landing, cadastro, teste e checkout.
- Criar copy clara para pais, alunos e professores.

Critérios de pronto:

- Landing com proposta direta e screenshots/video do PianoEngine.
- Secao de prova social e beneficios orientados a resultado.
- Pricing com ancoragem mensal/anual, reducao de risco e CTA rastreado.
- Fluxo de checkout monitorado por `checkout_started` e `checkout_redirected`.

## Fase 3 - Onboarding guiado

Status: implementado parcialmente.

Objetivos:

- Guiar o primeiro uso por nivel, objetivo musical e instrumento.
- Recomendar a primeira musica automaticamente.
- Fazer o aluno tocar rapidamente e entender valor antes de abandonar.

Critérios de pronto:

- Wizard inicial para novos alunos.
- Preferencias salvas localmente.
- Biblioteca prioriza recomendacao baseada no objetivo.
- Primeiro progresso aparece logo apos a primeira aula pelo historico de pratica existente.

## Fase 4 - Retencao e habito

Status: implementado parcialmente.

Objetivos:

- Melhorar retorno diario e semanal.
- Criar metas, streak, recomendacao diaria, plano de estudo e chamadas de continuidade.

Critérios de pronto:

- Painel com meta diaria/semanal ja existente e conectado ao historico.
- Recomendacao diaria clara no dashboard e biblioteca.
- Plano de estudo progressivo por insight de pratica e tela final.
- Historico e conquistas mais visiveis no dashboard.

## Fase 5 - Escala tecnica e confianca

Status: pendente.

Objetivos:

- Preparar producao para trafego pago e usuarios reais.
- Cobrir erro, performance, checkout, seguranca, logs e suporte.

Critérios de pronto:

- Checklist de producao automatizado.
- Logs de eventos criticos.
- Teste real Stripe documentado.
- Testes em aparelhos fisicos documentados.
- Pendencias juridicas/licencas documentadas.

## Pendencias que dependem do dono

- Confirmar ferramenta externa de analytics/pixel, caso queira alem do tracking interno.
- Validar direitos autorais/licencas das musicas, imagens e arranjos.
- Executar teste real de compra/cancelamento com conta Stripe de producao ou sandbox configurada.
- Testar microfone/MIDI em aparelhos fisicos reais.
