# Reconstrucao da biblioteca musical

Este diretorio controla a reconstrucao das 82 musicas legadas do Pianify. As oito musicas do lote piloto estao congeladas em `frozen-pilot-lock.json` e nao pertencem a este trabalho.

## Regra de publicacao

Uma musica reconstruida somente pode sair de `blocked_until_canonical` quando possuir:

1. fonte independente do MIDI legado;
2. identidade da composicao e da edicao;
3. licenca e URL verificaveis;
4. arquivo local imutavel com SHA-256;
5. comparacao exata entre fonte e arranjo canonico;
6. versoes easy, medium e hard auditadas;
7. maos, duracoes, sobreposicoes e faixa MIDI validadas;
8. revisao auditiva do proprietario.

O MIDI existente em `public/midi` pode ser usado apenas como referencia secundaria para detectar divergencias. Ele nunca prova fidelidade nem direitos de uso.

## Comandos

- `npm run verify-frozen-music-pilot`: confirma que as oito musicas congeladas nao mudaram.
- `npm run plan-music-rebuild`: atualiza `docs/song-library-rebuild-plan.*` com as 82 musicas, ondas e riscos.

## Base juridica de triagem

A classificacao inicial segue a Lei 9.610/1998 e a orientacao publica do Ministerio da Cultura: composicao, letra, traducao, arranjo, edicao e gravacao podem ter titulares diferentes. O relatorio e uma triagem editorial, nao um parecer juridico.

- https://www.gov.br/cultura/pt-br/assuntos/direitos-autorais/perguntas-frequentes/perguntas-frequentes
- https://www.gov.br/bn/pt-br/atuacao/direitos-autorais-1/direitos-autorais
