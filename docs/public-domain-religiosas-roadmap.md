# Repertorio religioso de dominio publico para adicionar

Este arquivo consolida 20 musicas religiosas muito conhecidas no Brasil que sao boas candidatas para entrar na biblioteca da Pianify na categoria `Religiosos`.

## Cuidado importante com dominio publico

As melodias e os textos originais abaixo sao antigos e, em geral, seguros como base de dominio publico. O cuidado maior esta nas **traducoes em portugues**, **arranjos modernos** e **gravacoes**.

Para manter o projeto seguro:

1. Priorize MIDIs instrumentais baseados na melodia tradicional
2. Evite arranjos modernos protegidos
3. Se usar uma versao em portugues muito especifica, confira se o tradutor tambem esta em dominio publico
4. Quando houver duvida, trate a faixa como instrumental tradicional e use `Tradicional` no pipeline

## Lista oficial

| # | Titulo exibido | ID sugerido | Arquivo `.mid` sugerido | Categoria | Artist |
|---|---|---|---|---|---|
| 1 | Amazing Grace | `amazing-grace` | `amazing_grace.mid` | `Religiosos` | `John Newton` |
| 2 | Castelo Forte | `castelo-forte` | `castelo_forte.mid` | `Religiosos` | `Martinho Lutero` |
| 3 | Mais Perto Quero Estar | `mais-perto-quero-estar` | `mais_perto_quero_estar.mid` | `Religiosos` | `Sarah Flower Adams` |
| 4 | Rocha Eterna | `rocha-eterna` | `rocha_eterna.mid` | `Religiosos` | `Augustus Toplady` |
| 5 | Santo, Santo, Santo | `santo-santo-santo` | `santo_santo_santo.mid` | `Religiosos` | `Reginald Heber` |
| 6 | Noite Feliz | `noite-feliz` | `noite_feliz.mid` | `Religiosos` | `Franz Xaver Gruber` |
| 7 | Vinde Fieis | `vinde-fieis` | `vinde_fieis.mid` | `Religiosos` | `Tradicional` |
| 8 | O Vem, O Vem, Emanuel | `o-vem-o-vem-emanuel` | `o_vem_o_vem_emanuel.mid` | `Religiosos` | `Tradicional` |
| 9 | Jubiloso, Te Adoramos | `jubiloso-te-adoramos` | `jubiloso_te_adoramos.mid` | `Religiosos` | `Henry van Dyke / Beethoven` |
| 10 | Firme nas Promessas | `firme-nas-promessas` | `firme_nas_promessas.mid` | `Religiosos` | `Russell Kelso Carter` |
| 11 | Conta as Bencaos | `conta-as-bencaos` | `conta_as_bencaos.mid` | `Religiosos` | `Johnson Oatman Jr.` |
| 12 | Sou Feliz com Jesus | `sou-feliz-com-jesus` | `sou_feliz_com_jesus.mid` | `Religiosos` | `Horatio Spafford` |
| 13 | Coroai | `coroai` | `coroai.mid` | `Religiosos` | `Matthew Bridges` |
| 14 | Manso e Suave | `manso-e-suave` | `manso_e_suave.mid` | `Religiosos` | `Will L. Thompson` |
| 15 | Aos Pes da Cruz | `aos-pes-da-cruz` | `aos_pes_da_cruz.mid` | `Religiosos` | `Isaac Watts / Ralph E. Hudson` |
| 16 | Alvo Mais que a Neve | `alvo-mais-que-a-neve` | `alvo_mais_que_a_neve.mid` | `Religiosos` | `James Nicholson` |
| 17 | Chuvas de Graca | `chuvas-de-graca` | `chuvas_de_graca.mid` | `Religiosos` | `Daniel W. Whittle` |
| 18 | Deus Velara por Ti | `deus-velara-por-ti` | `deus_velara_por_ti.mid` | `Religiosos` | `Civilla D. Martin` |
| 19 | Gloria, Gloria, Aleluia | `gloria-gloria-aleluia` | `gloria_gloria_aleluia.mid` | `Religiosos` | `Julia Ward Howe` |
| 20 | Tao Sublime Sacramento | `tao-sublime-sacramento` | `tao_sublime_sacramento.mid` | `Religiosos` | `Tradicional Liturgico` |

## Estrategia recomendada para a Pianify

- `easy`: mao direita apenas, melodia principal
- `medium`: melodia + base harmonica leve
- `hard`: arranjo congregacional mais completo

## Como buscar os MIDIs

Priorize sempre:

1. MIDI melodico ou arranjo simples de piano
2. Fonte marcada como `Traditional`, `Public Domain`, `Hymn`, `Sacred traditional` ou equivalente
3. Arquivos com melodia completa e andamento limpo

Evite:

- playback com bateria, pads e muitos instrumentos
- arranjos modernos de ministerios atuais
- arquivos com titulos genericos como `track 0`, `piano1`, `untitled`
- traducoes recentes sem autor/tradutor identificado

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

`scripts/public-domain-religious-seed.js`

Esse arquivo serve como base para copiar os metadados e o manifesto sem redigitar tudo.

## Referencias usadas para a selecao

- [Cantor Cristao - Wikisource](https://pt.wikisource.org/wiki/Cantor_Crist%C3%A3o)
- [Salmos e Hinos - Wikipedia](https://pt.wikipedia.org/wiki/Salmos_e_Hinos)
- [Harpa Crista - Wikipedia](https://pt.wikipedia.org/wiki/Harpa_Crist%C3%A3)
- [Hinos de Louvores e Suplicas a Deus - Wikipedia](https://pt.wikipedia.org/wiki/Hinos_de_Louvores_e_S%C3%BAplicas_a_Deus)

Observacao:
Estas referencias ajudam a confirmar a ampla circulacao historica desses hinos no Brasil. Ainda assim, para o uso de cada MIDI concreto, mantenha o cuidado com arranjos e traducoes especificas.
