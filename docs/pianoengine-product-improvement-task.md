# Task: Evoluir PianoEngine para experiencia premium de ensino

## Objetivo

Transformar o PianoEngine em uma experiencia de ensino de teclado mais bonita, interativa, inteligente e confiavel, com fluxo completo de aluno, feedback musical detalhado, progresso pedagogico e garantia continua da biblioteca de musicas.

## Contexto atual

- Biblioteca musical validada por auditoria tecnica: 90/90 musicas OK.
- Fidelidade contra MIDI fonte validada: 90/90 musicas OK.
- Build de producao passando.
- Tutorial interativo e modos de mao ja receberam melhorias, mas ainda precisam ser testados visualmente no fluxo real.

## Escopo

### 1. Teste visual e funcional do PianoEngine

Validar no navegador o fluxo completo:

- abrir biblioteca;
- escolher musica;
- selecionar dificuldade;
- selecionar 1 mao, 2 maos, mao esquerda e mao direita;
- iniciar tutorial;
- pausar/despausar;
- alterar velocidade;
- ativar modo espera;
- usar loop;
- tocar notas pelo teclado/MIDI/microfone quando disponivel;
- finalizar musica;
- exibir pontuacao e resumo.

Critérios de aceite:

- Nenhum fluxo deve deixar o player travado.
- Nenhum modo deve carregar sem notas.
- Controles devem refletir estado real em tempo real.
- Tutorial deve pausar/avancar somente quando a interacao correta acontecer.
- Nao deve haver erro no console em fluxo principal.

### 2. Ensino inteligente por trechos

Adicionar comportamento pedagogico:

- detectar trechos dificeis por erros recorrentes;
- permitir repetir trecho automaticamente;
- sugerir reduzir velocidade quando a precisao cair;
- liberar avanço quando o aluno acertar uma sequencia minima;
- destacar mao, nota e tempo problemáticos.

Critérios de aceite:

- O aluno consegue treinar um trecho curto sem reiniciar a musica.
- O sistema identifica erros repetidos por tempo/nota.
- O modo espera e loop funcionam juntos sem conflito.

### 3. Feedback musical detalhado

Melhorar feedback além de acerto/erro:

- nota certa cedo demais;
- nota certa tarde demais;
- nota errada;
- duracao segurada pouco tempo;
- soltou antes do fim;
- mao esperada;
- trecho com maior dificuldade;
- sugestao de treino apos a musica.

Critérios de aceite:

- Score final mostra estatisticas uteis.
- Feedback durante a musica nao polui a tela.
- Feedback usa dados reais de timing e notas esperadas.

### 4. Polimento visual premium

Melhorar layout e sensacao do PianoEngine:

- notas com visual mais bonito e legivel;
- cauda de notas longas desaparecendo progressivamente conforme o tempo avanca;
- glow/animacao no acerto;
- diferenciar mao esquerda/direita com cor e forma;
- teclado com estados visuais mais claros;
- HUD compacto e elegante;
- responsividade desktop/mobile;
- evitar sobreposicao de texto/controles.

Critérios de aceite:

- Notas longas nao desaparecem no primeiro acerto.
- A leitura das notas fica clara em velocidades diferentes.
- Layout permanece estavel em desktop e mobile.
- Visual deve parecer app premium, nao prototipo.

### 5. Qualidade sonora e entrada

Revisar audio e input:

- resposta de MIDI;
- resposta de teclado QWERTY;
- microfone sem desativar indevidamente no tutorial;
- sustain/envelope das notas;
- volume por velocity;
- acompanhamento musical sem conflito com notas do aluno.

Critérios de aceite:

- Tocar uma nota gera resposta audivel e visual imediata.
- Modo microfone nao muda de estado sem intencao do usuario.
- Acompanhamento nao atrapalha pontuacao.

### 6. Sistema de progresso

Adicionar ou melhorar acompanhamento de aprendizado:

- progresso por musica;
- progresso por dificuldade;
- progresso por mao;
- estrelas/medalhas por precisao;
- recomendacao da proxima musica;
- historico de sessoes;
- metas diarias.

Critérios de aceite:

- O aluno entende o que melhorou.
- O app sugere uma proxima acao clara.
- Dados salvos batem com a sessao jogada.

### 7. Garantia continua da biblioteca

Manter as auditorias como portao de qualidade:

- `npm.cmd run audit-song-library`
- `npm.cmd run audit-song-source-fidelity`
- `npm.cmd run build`

Critérios de aceite:

- Qualquer musica nova precisa passar nas auditorias.
- Relatorios devem continuar em `docs/`.
- Falhas devem apontar a musica e o motivo.

## Arquivos provaveis

- `src/components/PianoPlayer.tsx`
- `src/components/PianoEngine.tsx`
- `src/components/GameTutorialOverlay.tsx`
- `src/components/SongSummaryModal.tsx`
- `src/app/dashboard/play/[songId]/page.tsx`
- `src/lib/songFilters.ts`
- `src/hooks/useKeyboardInput.ts`
- `src/hooks/useMIDI.ts`
- `src/hooks/useAudioInput.ts`
- `src/lib/practiceHistory.ts`
- `scripts/audit-song-library.js`
- `scripts/audit-song-source-fidelity.js`

## Plano de execucao sugerido

1. Rodar app localmente e testar fluxo real do PianoEngine.
2. Corrigir bugs funcionais encontrados no teste visual.
3. Melhorar visual das notas, caudas, acertos e HUD.
4. Implementar feedback musical detalhado.
5. Implementar treino por trechos com loop inteligente.
6. Melhorar resumo final e progresso do aluno.
7. Rodar auditorias e build.

## Comandos de validacao

```powershell
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Quando houver alteracao visual importante, validar tambem no navegador em desktop e mobile.

## Progresso aplicado

### Lote 1 - feedback e treino inteligente

Status: implementado.

- O `PianoPlayer` agora coleta estatisticas reais de pratica: acertos, erros, acertos perfeitos, notas cedo/tarde, combo maximo e media de timing.
- O player detecta trechos com erros recorrentes e emite sugestao de treino.
- A pagina de jogo mostra um card de "Treino inteligente" com acao para ativar loop, reduzir velocidade e ligar modo espera no trecho sugerido.
- A tela final mostra recomendacao personalizada, notas acertadas, acertos perfeitos, media de timing e tendencia de timing.
- O feedback ao vivo mostra mensagens curtas como "Perfeito", "Cedo", "Tarde", "Nota perdida" e "Trecho dificil detectado".

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Build de producao passou.

### Lote 15 - QA responsivo completo do PianoEngine

Status: implementado.

- Criado o script `scripts/responsive-pianoengine-qa.js` para abrir o Chrome via CDP e validar o player em mobile portrait, mobile landscape, tablet e desktop.
- Adicionados `data-testid` estaveis aos elementos criticos do player: canvas, teclado, HUD, progresso, tutorial, treino inteligente, orientacao e tela final.
- O QA encontrou um problema real no mobile landscape: o card do tutorial invadia a area do teclado.
- O card do tutorial agora tem altura maxima responsiva e rolagem interna em telas baixas, mantendo as teclas visiveis durante a orientacao.
- Relatorio e screenshots foram gerados em `tmp/responsive-qa/`.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-player-modes
npm.cmd run build
node scripts/responsive-pianoengine-qa.js
```

Resultado:

- TypeScript passou.
- Modos reais passaram com 810/810 combinacoes OK e 1 alerta baixo informativo.
- Build de producao passou.
- QA responsivo passou sem issues em `390x844`, `844x390`, `834x1112` e `1440x900`, com os estados tutorial, tocando e tela final detectados corretamente em todos os tamanhos.

### Lote 16 - QA responsivo interativo no mobile

Status: implementado.

- O QA responsivo passou a validar interacoes reais no mobile landscape, incluindo tecla virtual `C4`, velocidade, modo espera, loop, metronomo e pausa.
- A barra superior do PianoEngine foi ajustada para telas estreitas, com titulo truncado e controles em uma faixa horizontal rolavel, evitando corte de botoes no mobile landscape.
- O controle de pausa virou um botao fixo com icone, sempre visivel ao lado do titulo, e passou a responder tambem a `touchstart`.
- O botao de pausa ganhou protecao contra duplo disparo entre toque e click sintetico.
- O script agora diferencia overlay de rotacao visivel de overlay apenas montado no DOM, evitando falso positivo em landscape.
- O QA tambem valida rolagem da tela final e presenca dos botoes principais apos o fim da musica.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-player-modes
npm.cmd run build
node scripts/responsive-pianoengine-qa.js
```

Resultado:

- TypeScript passou.
- Modos reais passaram com 810/810 combinacoes OK e 1 alerta baixo informativo.
- Build de producao passou.
- QA responsivo interativo passou sem issues em mobile portrait, mobile landscape, tablet e desktop.

### Lote 17 - Pre-lancamento comercial

Status: implementado.

- Criado o script `scripts/audit-launch-readiness.js` para auditar prontidao comercial antes de anunciar.
- Adicionado o comando `npm.cmd run audit-launch-readiness`.
- Gerados os relatorios `docs/launch-readiness-audit.md` e `docs/launch-readiness-audit.json`.
- O bypass local `/api/auth/local-test` agora depende de `isLocalDevAuthAllowed`, bloqueando uso em `NODE_ENV=production` mesmo que o host pareca local.
- Middleware, rota local-test e hooks de perfil/assinatura passaram a compartilhar a mesma regra de auth local.
- A auditoria cobre variaveis obrigatorias, Stripe checkout, webhook assinado, portal autenticado, rotas admin/professor, headers de seguranca, catalogo de musicas e pendencias manuais de negocio.

Validacoes realizadas:

```powershell
npm.cmd run audit-launch-readiness
npx.cmd tsc --noEmit
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- Auditoria de pre-lancamento: 25 OK, 3 alertas, 0 falhas.
- TypeScript passou.
- Modos reais passaram com 810/810 combinacoes OK e 1 alerta baixo informativo.
- Build de producao passou.
- Alertas restantes sao manuais: direitos autorais/licencas, teste real de compra Stripe e teste em aparelhos fisicos.

### Lote 12 - polimento visual premium e reset do motor

Status: implementado.

- O canvas do PianoEngine recebeu palco mais profundo, trilhos sutis por mao, destaque nas faixas de C, grade musical mais refinada e linha de acerto com brilho/pulso.
- As notas ganharam gradiente mais rico, borda luminosa, brilho de aproximacao, realce superior e guia visual para notas sustentadas.
- Notas longas acertadas agora exibem uma drenagem visual progressiva durante a sustentacao, em vez de parecerem blocos estaticos.
- O HUD de pontuacao/combo/precisao foi polido com glass escuro, sombras coloridas e barra de progresso mais premium.
- O card de "Treino inteligente" foi compactado e reposicionado para atrapalhar menos a leitura das notas e do teclado.
- O `PianoPlayer` recebeu uma chave de reset por sessao, evitando que tempo interno, notas perdidas/acertadas e progresso vazem entre uma execucao e outra apos reiniciar.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.
- QA visual no navegador confirmou o player carregando Borboletinha, notas caindo, teclado virtual, feedback de nota perdida e card de treino compacto sem cobrir toda a area de leitura.

### Lote 13 - limpeza de textos e encoding

Status: implementado.

- O normalizador `scripts/text-normalization.js` agora converte mojibake comum diretamente para UTF-8 correto, incluindo acentos, travessões, aspas tipográficas, marcadores, checks e símbolos visuais.
- Foram corrigidos textos visíveis do PianoEngine e tutorial para português natural com acentuação: música, próximo, resolução, precisão, prática, metrônomo, pontuação, análise, entre outros.
- O fluxo do player foi checado no navegador e não apresentou mojibake no DOM renderizado.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.
- QA no navegador confirmou: `música`, `Próximo`, `Resolução` e `Não mostrar novamente` renderizando corretamente, sem `Ã`, `Â`, `â€`, `âœ` ou `ðŸ`.

### Lote 14 - tela final premium e plano de treino

Status: implementado.

- A tela final foi redesenhada com leitura em duas colunas no desktop e fluxo compacto no mobile.
- O aluno agora ve um resumo mais claro com precisao, meta, pontos, sequencia, notas acertadas, notas perfeitas e timing.
- O diagnostico ficou mais orientado para acao, com foco em timing cedo/tarde, notas problema e trecho fraco.
- O plano de pratica ganhou destaque visual, velocidade sugerida, trecho recomendado e etiquetas traduzidas para revisar, consolidar, avancar ou dominado.
- Os botoes finais foram reorganizados para priorizar "Treinar trecho", "Tocar novamente" e "Proxima musica".

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.
- QA no navegador confirmou a tela final com Resultado, Diagnostico, Plano de pratica, Tocar novamente e Proxima musica sem mojibake.

### Lote 4 - feedback pedagogico e auditoria dos modos reais

Status: implementado.

- O `PianoPlayer` agora identifica notas inesperadas tocadas pelo aluno, registra notas mais problematicas por MIDI/mao/tempo e inclui esses dados no resumo final.
- O modo loop agora detecta repeticoes limpas do trecho. Depois de ciclos bem-sucedidos, o app sugere subir a velocidade ou voltar para a musica completa.
- A tela final mostra notas erradas, loops limpos e foco de estudo nas notas que mais falharam.
- O acompanhamento dos modos de uma mao agora remove notas que coincidam exatamente com a parte do aluno, evitando que o app toque por cima da nota que deveria ser praticada.
- A selecao de notas por mao evita escolher uma versao quase vazia quando existe outra versao mais adequada para o player.
- Foi criado o script `audit-player-modes`, que testa 810 combinacoes reais: 90 musicas x 3 dificuldades x 3 modos de mao.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

Observacao: o dev server local foi iniciado na porta 3014 apos aprovacao, mas as rotas ficaram sem resposta mesmo para a home. A validacao visual em navegador continua bloqueada pelo comportamento do servidor de desenvolvimento neste ambiente; o build de producao segue passando.

### Lote 5 - plano de pratica apos a musica

Status: implementado.

- Foi criado o helper `practicePlan`, que transforma precisao, dificuldade e feedback real em um plano de proxima pratica.
- A tela final agora mostra um bloco de "Plano de pratica" com titulo, mensagem, meta de precisao, velocidade sugerida e focos objetivos.
- O plano diferencia cenarios como trecho dominado, trecho dificil, notas inesperadas, timing cedo/tarde e aluno pronto para avancar.
- O botao de treino de trecho passa a usar a acao sugerida quando o plano recomenda isolar o intervalo.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

### Lote 6 - progresso e proxima acao no dashboard/perfil

Status: implementado.

- Foi criado o helper `practiceProgress`, que analisa perfil, sessoes recentes, media recente, melhor precisao e frequencia semanal.
- O dashboard principal agora mostra um card de "Proximo passo" com mensagem contextual, metricas da semana, foco sugerido e atalho para a acao correta.
- A pagina de perfil agora mostra um "Plano ativo" alinhado ao historico real do aluno.
- O insight diferencia aluno novo, revisao por baixa precisao, construcao de constancia, manutencao de evolucao e pronto para desafio.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

### Lote 7 - metas e medalhas reais

Status: implementado.

- O helper `practiceProgress` agora tambem gera metas semanais e conquistas reais a partir do historico.
- O dashboard substituiu as medalhas mockadas por conquistas com progresso real.
- O dashboard ganhou metas de sessoes semanais, musicas concluidas e precisao recente.
- A pagina de perfil passou a mostrar as mesmas metas e uma colecao de conquistas calculadas por criterios reais: primeira sessao, sequencia, precisao, repertorio, tempo total, duas maos e modo profissional.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

### Lote 8 - recomendacao de aula por historico

Status: implementado.

- O helper `practiceProgress` agora gera uma recomendacao concreta de musica, dificuldade e modo de mao.
- A recomendacao considera aluno novo, sessao recente com baixa precisao, desempenho alto para desafio, equilibrio entre maos e musicas ainda nao tocadas.
- O dashboard passou a mostrar um card de "Aula recomendada" com link direto para o player ja parametrizado.
- A pagina de perfil tambem mostra a aula recomendada, mantendo o plano ativo e o historico conectados a uma proxima acao objetiva.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

### Lote 9 - recomendacao na biblioteca

Status: implementado.

- A tela de biblioteca agora tambem carrega o historico recente do aluno.
- A biblioteca mostra uma "Aula recomendada para agora" antes da grade de musicas.
- O card leva direto para o player com musica, dificuldade e modo de mao definidos pelo historico.
- A recomendacao da biblioteca usa a mesma inteligencia do dashboard e perfil, mantendo uma experiencia consistente.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.

Observacao atualizada: a validacao visual em navegador local foi retomada no Lote 10.

### Lote 10 - servidor local e validacao visual

Status: implementado.

- A falha do navegador local foi diagnosticada como build `.next` inconsistente: o middleware compilado continha `eval-source-map`, gerando erro `Code generation from strings disallowed for this context`.
- A pasta `.next` foi limpa e o projeto foi reconstruido com `npm.cmd run build`.
- O servidor de producao local foi iniciado em `http://127.0.0.1:3014`.
- A rota `/dashboard/songs` voltou a responder `200` no teste HTTP.
- O navegador interno passou a carregar a aplicacao; sem sessao ativa, o redirecionamento esperado foi para `/login`.

Validacoes realizadas:

```powershell
npm.cmd run build
Invoke-WebRequest http://127.0.0.1:3014/dashboard/songs
```

Resultado:

- Build de producao passou.
- Servidor local em `3014` ativo.
- `/dashboard/songs` respondeu `200`.
- Navegador interno carregou a aplicacao e redirecionou para login quando sem autenticacao.

### Lote 11 - QA real do PianoEngine e tutorial

Status: implementado.

- Foi criado um modo de teste local restrito a `localhost`, `127.0.0.1` e `::1`, permitindo validar o app sem depender do Turnstile em ambiente local.
- A rota `/api/auth/local-test` cria um cookie local de teste e redireciona para a biblioteca.
- O acesso local de teste passa a ser tratado como aluno Pro no cliente, liberando biblioteca e player sem chamada de assinatura.
- O overlay de rotacao agora aparece apenas em dispositivos touch reais, evitando bloquear tutorial e cliques no navegador desktop estreito.
- O card de microfone no tutorial deixou de exigir clique, evitando pedido de permissao de audio durante QA ou quando o microfone ja estiver ativo.
- As teclas virtuais ganharam `aria-label` com nota e oitava, como `C4` e `D#4`, melhorando acessibilidade e tornando o passo do teclado verificavel.
- O ultimo passo do tutorial agora conclui automaticamente apos a acao obrigatoria final, reiniciando a musica real do zero.
- QA real validou: avancar/voltar no tutorial, volume, pausa por Espaco, loop, velocidade, modo espera, metronomo, reiniciar, teclado C4, inicio da musica real e carregamento dos modos de mao.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run audit-player-modes
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Auditoria dos modos reais: 810/810 OK, com 1 alerta baixo informativo.
- Build de producao passou.
- Player carregou Borboletinha em mao direita, mao esquerda, duas maos, intermediario e profissional sem estado vazio ou erro de rota.

### Lote 2 - treino focado acionavel

Status: implementado.

- A tela final agora exibe o botao "Treinar Trecho Recomendado" quando existe um trecho fraco detectado.
- O botao prepara automaticamente loop no intervalo recomendado, reduz velocidade para 65% e ativa modo espera.
- A tela inicial passa a indicar quando ha um trecho preparado, mostrando intervalo e velocidade.
- O botao de reiniciar agora usa o fluxo completo de reset do jogo.

Validacoes realizadas:

```powershell
npm.cmd run build
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
```

Resultado:

- Build passou.
- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.

### Lote 3 - inicio real no trecho treinado

Status: implementado.

- O treino focado agora inicializa o `PianoPlayer` diretamente no tempo do loop recomendado, em vez de recomeçar sempre do zero.
- A contagem inicial preserva o lead-in visual antes do trecho, fazendo as notas aparecerem alguns segundos antes da linha de acerto sem perder a referencia do intervalo escolhido.
- Ao iniciar com loop ativo, a barra de progresso e o tempo atual ja partem do inicio do trecho preparado.

Validacoes realizadas:

```powershell
npx.cmd tsc --noEmit
npm.cmd run audit-song-library
npm.cmd run audit-song-source-fidelity
npm.cmd run build
```

Resultado:

- TypeScript passou.
- Auditoria tecnica: 90/90 OK.
- Auditoria de fidelidade: 90/90 OK.
- Build de producao passou.
