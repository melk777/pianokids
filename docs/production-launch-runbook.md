# Runbook de lançamento do Pianify

Este documento separa o que já é automatizado no repositório do que ainda exige credenciais, serviços externos ou validação humana. Nenhuma etapa crítica deve ser ignorada no lançamento pago.

## 1. Preparar staging

- Criar ou reativar um projeto Supabase exclusivo para staging.
- Confirmar que existe backup recuperável antes de aplicar qualquer migração.
- Aplicar todas as migrações de `supabase/migrations` em ordem cronológica.
- Confirmar no banco as funções `claim_stripe_webhook_event`, `record_paid_invoice`, `request_teacher_withdrawal` e `review_teacher_withdrawal`.
- Validar que usuários comuns não conseguem inserir diretamente em `practice_sessions`, `withdrawals`, `profiles`, `messages`, `friendships` ou tabelas financeiras.
- Criar contas de teste separadas para aluno, professor e administrador.

## 2. Configurar autenticação e proteção antiabuso

- Definir no Supabase a URL oficial e os redirecionamentos para `/auth/callback` e `/auth/update-password`.
- Testar confirmação de e-mail, login, logout, recuperação e troca de senha.
- Configurar o Cloudflare Turnstile para os domínios de staging e produção.
- Manter o cadastro restrito a maiores de 18 anos neste lançamento.
- Manter `NEXT_PUBLIC_SOCIAL_FEATURES_ENABLED=false` até existir fluxo específico para menores, denúncia, bloqueio e moderação.

## 3. Configurar Stripe em modo de teste

- Criar produto, preço mensal e preço anual e preencher os respectivos Price IDs.
- Criar o endpoint de webhook `/api/stripe/webhook`.
- Assinar pelo menos os eventos de checkout, assinatura, invoice paga/falha, reembolso e disputa tratados pela rota.
- Fazer uma compra mensal e uma anual com cartão de teste.
- Reenviar o mesmo webhook e comprovar que não há assinatura, comissão ou receita duplicada.
- Testar portal, cancelamento, renovação, `past_due`, reativação, reembolso e disputa.
- Confirmar que uma comissão só fica sacável após o prazo configurado e que aprovação/rejeição de saque é idempotente.

Somente depois desse ciclo completo substitua as chaves de teste pelas chaves de produção.

## 4. Configurar produção

- Preencher na Vercel todas as variáveis documentadas em `.env.example`, sem compartilhar os valores em tickets ou commits.
- Definir `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_BASE_URL` com a URL HTTPS canônica.
- Preencher razão social, CNPJ e endereço empresarial reais.
- Conferir que previews não recebem, por engano, as credenciais live do Stripe.
- Executar o workflow de CI e exigir sucesso em tipos, testes, lint, auditoria de dependências e build.
- Verificar que `/api/health` retorna `200` em produção; um `503` indica ambiente ou banco incompleto.

## 5. Validar produto ponta a ponta

- Visitante: home, planos, termos, privacidade, FAQ e redirecionamento de login.
- Aluno gratuito: biblioteca permitida, bloqueio do catálogo premium, prática e persistência de sessão.
- Aluno Pro mensal e anual: checkout, retorno, acesso imediato, portal e cancelamento.
- Professor: indicação, comissão paga, prazo de disponibilidade e solicitação de saque.
- Administrador: receita líquida, despesas, revisão de saque e prontidão operacional.
- Conta: exportação de dados, pedido de exclusão e contato de suporte.
- Player: teclado físico, teclado na tela, microfone e MIDI nas três dificuldades.

Execute em Chrome, Edge e Safari, cobrindo ao menos iPhone, Android, tablet, notebook e desktop. Microfone e MIDI precisam de aparelhos físicos e HTTPS.

## 6. Conteúdo e conformidade

- Fazer escuta humana das 90 músicas em todas as dificuldades e corrigir qualquer nota, acorde, andamento ou título inconsistente.
- Manter no catálogo público somente músicas, arranjos, capas e marcas com uso comercial comprovado.
- Guardar documentação de domínio público ou licença de cada item.
- Obter revisão jurídica dos Termos, Política de Privacidade, política de cancelamento e fluxo de direitos do titular.
- Obter revisão contábil/fiscal das assinaturas, notas e pagamentos a professores.
- Só ativar `NEXT_PUBLIC_SHOW_VERIFIED_TESTIMONIALS=true` após substituir exemplos por depoimentos reais, documentados e autorizados.

## 7. Operação e decisão de lançamento

- Configurar alerta para falhas de `/api/health`, webhooks Stripe e erros 5xx.
- Definir responsável por suporte, reembolsos, disputas, incidentes de dados e saques.
- Registrar o commit e a versão implantados e manter um procedimento de rollback testado.
- Fazer uma assinatura real de baixo valor e confirmar pagamento, acesso, fatura, comissão e cancelamento.

O lançamento pago só recebe sinal verde quando não houver falha automatizada, as migrações tiverem sido validadas em staging e todos os itens manuais críticos estiverem documentados como aprovados.
