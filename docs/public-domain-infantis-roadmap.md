# Repertorio infantil de dominio publico para adicionar

Este arquivo consolida 20 musicas infantis e cantigas de roda populares no Brasil que sao boas candidatas para entrar na biblioteca da Pianify.

## Lista oficial

| # | Titulo exibido | ID sugerido | Arquivo `.mid` sugerido | Categoria | Artist |
|---|---|---|---|---|---|
| 1 | Ciranda, Cirandinha | `ciranda-cirandinha` | `ciranda_cirandinha.mid` | `Infantis` | `Tradicional` |
| 2 | Atirei o Pau no Gato | `atirei-o-pau-no-gato` | `atirei_o_pau_no_gato.mid` | `Infantis` | `Tradicional` |
| 3 | Escravos de Jó | `escravos-de-jo` | `escravos_de_jo.mid` | `Infantis` | `Tradicional` |
| 4 | Peixe Vivo | `peixe-vivo` | `peixe_vivo.mid` | `Infantis` | `Tradicional` |
| 5 | Alecrim | `alecrim-dourado` | `alecrim.mid` | `Infantis` | `Tradicional` |
| 6 | A Canoa Virou | `a-canoa-virou` | `a_canoa_virou.mid` | `Infantis` | `Tradicional` |
| 7 | O Cravo e a Rosa | `o-cravo-e-a-rosa` | `o_cravo_e_a_rosa.mid` | `Infantis` | `Tradicional` |
| 8 | Marcha Soldado | `marcha-soldado` | `marcha_soldado.mid` | `Infantis` | `Tradicional` |
| 9 | Samba Lelê | `samba-lele` | `samba_lele.mid` | `Infantis` | `Tradicional` |
| 10 | Pirulito que Bate Bate | `pirulito-que-bate-bate` | `pirulito_que_bate_bate.mid` | `Infantis` | `Tradicional` |
| 11 | Fui no Itororó | `fui-no-itororo` | `fui_no_itororo.mid` | `Infantis` | `Tradicional` |
| 12 | Capelinha de Melão | `capelinha-de-melao` | `capelinha_de_melao.mid` | `Infantis` | `Tradicional` |
| 13 | Boi da Cara Preta | `boi-da-cara-preta` | `boi_da_cara_preta.mid` | `Infantis` | `Tradicional` |
| 14 | Pombinha Branca | `pombinha-branca` | `pombinha_branca.mid` | `Infantis` | `Tradicional` |
| 15 | Caranguejo | `caranguejo` | `caranguejo.mid` | `Infantis` | `Tradicional` |
| 16 | Teresinha de Jesus | `teresinha-de-jesus` | `teresinha_de_jesus.mid` | `Infantis` | `Tradicional` |
| 17 | Carneirinho, Carneirão | `carneirinho-carneirao` | `carneirinho_carneirao.mid` | `Infantis` | `Tradicional` |
| 18 | A Barata Diz que Tem | `a-barata-diz-que-tem` | `a_barata_diz_que_tem.mid` | `Infantis` | `Tradicional` |
| 19 | Indiozinhos | `indiozinhos` | `indiozinhos.mid` | `Infantis` | `Tradicional` |
| 20 | Meu Limão, Meu Limoeiro | `meu-limao-meu-limoeiro` | `meu_limao_meu_limoeiro.mid` | `Infantis` | `Tradicional` |

## Como buscar os MIDIs

Priorize sempre:

1. MIDI monofonico ou com arranjo infantil simples
2. Fonte claramente rotulada como `Traditional`, `Traditional Brazilian`, `Dominio Publico` ou equivalente
3. Arquivos com melodia completa e, se possivel, uma versao com acompanhamento leve

Evite:

- arranjos modernos protegidos
- MIDIs de playback com bateria, efeitos ou muitos instrumentos
- arquivos com letras quebradas ou titulos genericos como `track 0`

## Estrategia recomendada para a Pianify

- `easy`: mao direita apenas, melodia principal
- `medium`: melodia + baixo ou acompanhamento leve
- `hard`: arranjo infantil mais completo disponivel

## Fluxo de entrada

1. Baixe ou produza o `.mid`
2. Salve em `public/midi` com o nome recomendado desta lista
3. Adicione a musica no manifesto `scripts/song-manifest.js`
4. Adicione metadado em `scripts/song-catalog-metadata.js`
5. Rode:

```powershell
npm.cmd run parse-midi-graded
npm.cmd run validate-song-hands
npm.cmd run audit-song-library
```

6. Revise o JSON em `public/songs`
7. Cadastre a musica em `src/lib/songs.ts`

## Arquivo auxiliar

Os mesmos 20 registros desta lista tambem estao prontos em:

`scripts/public-domain-kids-seed.js`

Esse arquivo serve como base para voce copiar os metadados e o manifesto sem precisar digitar tudo de novo.

## Referencias usadas para a selecao

- Brasil Escola: cantigas de roda do folclore brasileiro
- Toda Materia: cantigas de roda populares no Brasil
- Miniweb / Biblioteca Virtual do Estudante Brasileiro: varias cantigas marcadas como dominio publico
- Tangara: coletaneas com cantigas marcadas como dominio publico
