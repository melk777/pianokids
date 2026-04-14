# Pipeline de MIDI para JSON

## Objetivo

Gerar um JSON por musica com 3 arranjos:

- `easy`
- `medium`
- `hard`

O formato final fica compativel com o jogo e tambem preserva compatibilidade com os campos antigos:

- `notes`
- `notes1Hand`
- `notes2Hands`

## Comando

Processar todos os arquivos `.mid` em `public/midi`:

```powershell
npm.cmd run parse-midi-graded
```

Processar um arquivo especifico:

```powershell
node scripts/midi-to-graded-json.js nome-da-musica.mid
```

## Regras atuais

- `hard`: versao mais completa e proxima do MIDI mestre
- `medium`: reduz densidade de acordes e remove ornamentos muito curtos
- `easy`: prioriza melodia principal e simplifica bastante a textura

## Fluxo recomendado

1. Coloque os MIDIs em `public/midi`
2. Rode `npm.cmd run parse-midi-graded`
3. Revise os JSONs gerados em `public/songs`
4. Ajuste manualmente as musicas mais complexas
5. Atualize metadados em `src/lib/songs.ts`

## Observacao importante

Esse pipeline gera uma base muito melhor para escalar, mas musicas classicas mais complexas ainda devem passar por revisao humana para garantir qualidade pedagogica real.
