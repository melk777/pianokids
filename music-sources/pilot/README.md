# Fontes canonicas do lote piloto

Este diretorio separa as fontes musicais verificadas do acervo MIDI legado. Os JSONs finais de oito musicas sao gerados apenas por `npm run build-music-pilot`; o comando nao apaga nem reconstroi as outras 82 musicas.

## Regras

- Cada fonte tem URL, edicao, licenca, data de verificacao e checksum quando ha arquivo local.
- MIDIs externos so entram por faixas explicitamente declaradas como piano e por uma mao definida no manifesto.
- Percussao e instrumentos orquestrais causam erro; nunca sao convertidos silenciosamente em piano.
- A versao `hard` de uma fonte MIDI preserva exatamente as notas das faixas selecionadas.
- Transcricoes simples preservam a melodia na versao `easy`; `medium` e `hard` recebem acompanhamento original do Pianify.
- Toda transcricao precisa declarar uma progressao harmonica completa; o pipeline recusa acordes inferidos ou lacunas harmonicas.
- O player usa o padrao de 61 teclas, de C2 a C7 (MIDI 36-96), que cobre toda a biblioteca atual.
- Todas as musicas permanecem com `reviewStatus: pending_owner_review` ate a aprovacao auditiva do proprietario.

## Fontes locais

- Bach, BWV 846: Mutopia-2011/09/12-5, dominio publico.
- Beethoven, Ode to Joy: Mutopia-2009/08/05-528, dominio publico.
- Beethoven, Fur Elise, WoO 59: Mutopia-2015/08/18-931, dominio publico. O piloto usa somente o trecho inicial.
- Gruber, Stille Nacht: Mutopia-2008/02/19-1295, dominio publico.
- Amazing Grace: os arquivos do Mutopia sao referencia secundaria CC BY-SA 3.0; a transcricao canonica do piloto usa a melodia historica New Britain documentada pela Library of Congress.
- Ciranda, Cirandinha: referencia visual de AllgoCoast, CC BY-SA 3.0, transposta de Sol para Do.
- Peixe Vivo: transcricao conferida compasso a compasso na partitura de Joao Batista Ribeiro Ferreira (Mestre JB), em Do maior, 2/4 e 100 BPM, marcada como dominio publico na propria fonte.
- Brilha Brilha Estrelinha: transcricao original do Pianify a partir das referencias publicas indicadas no manifesto.

## Comandos

```powershell
npm.cmd run build-music-pilot
npm.cmd run audit-music-pilot
```

Os MIDIs de revisao ficam em `output/music-review`. O relatorio independente fica em `docs/music-pilot-audit.md`.
