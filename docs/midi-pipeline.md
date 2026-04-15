# Pipeline de MIDI para JSON

## Objetivo

Gerar um JSON canonico por musica com 3 arranjos:

- `easy`
- `medium`
- `hard`

O formato final fica compativel com o jogo e tambem preserva compatibilidade com os campos antigos:

- `notes`
- `notes1Hand`
- `notes2Hands`

## Comando

Reconstruir toda a biblioteca a partir do manifesto em `scripts/song-manifest.js`:

```powershell
npm.cmd run parse-midi-graded
```

Validar e normalizar os campos `hand` depois da geracao:

```powershell
npm.cmd run validate-song-hands
```

## Regras atuais

- `hard`: usa a fonte MIDI mais completa da musica
- `medium`: usa a fonte intermediaria quando existir; caso contrario simplifica a versao `hard`
- `easy`: usa a fonte mais simples quando existir; caso contrario simplifica a versao `hard`
- antes de gerar, o script apaga todos os JSONs antigos de `public/songs`
- toda nota e normalizada com `hand: "left" | "right"`
- o pipeline emite alerta se `notes1Hand` ou `arrangements.easy` ainda trouxerem notas de mao esquerda e corrige isso automaticamente para mao direita

## Fluxo recomendado

1. Coloque os MIDIs em `public/midi`
2. Atualize o manifesto em `scripts/song-manifest.js`
3. Rode `npm.cmd run parse-midi-graded`
4. Rode `npm.cmd run validate-song-hands`
5. Revise os JSONs gerados em `public/songs`
6. Ajuste manualmente as musicas mais complexas
7. Atualize metadados em `src/lib/songs.ts` quando entrar repertorio novo

## Observacao importante

Esse pipeline gera uma base muito melhor para escalar, mas musicas classicas mais complexas ainda devem passar por revisao humana para garantir qualidade pedagogica real.
