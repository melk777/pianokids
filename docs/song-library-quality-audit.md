# Auditoria da biblioteca de musicas

Gerado em 2026-09-02T23:07:06.391Z.

Esta auditoria verifica consistencia interna, tocabilidade no player, marcacao de maos, dificuldade pedagogica, duracoes, lacunas, duplicidades e sinais harmonicos suspeitos. Fidelidade absoluta a cada obra original precisa de conferencia com partitura/audio de referencia por musica; aqui o relatorio aponta onde essa revisao humana deve entrar primeiro.

## Resumo

- Musicas analisadas: 90
- OK: 0
- Revisao leve: 90
- Precisa correcao: 0
- Criticas: 0
- Issues por severidade: critical=0, high=0, medium=176, low=78

## Problemas mais frequentes

- catalog_difficulty_mismatch: 68
- too_short_durations: 54
- easy_too_hard: 53
- medium_too_hard: 33
- dense_chord_cluster: 9
- very_long_durations: 9
- suspicious_hand_marking: 6
- late_start: 6
- suspicious_bpm: 5
- same_pitch_overlap: 4
- long_silence: 4
- declared_duration_long: 2
- many_semitone_clashes: 1

## Prioridade de revisao

- in-the-hall-of-the-mountain-king: 21 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- chopin-fantaisie-impromptuchopin: 20 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand demora 5.804s para a primeira nota cair.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
- minute-waltz: 18 pontos, status review. [medium] BPM suspeito para aula: 280.<br>[medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
- ballade-4chopin: 18 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- notteegiornomozart: 17 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- sonata-in-c-major-fragment-mozart: 17 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- ave-maria-schubert: 17 pontos, status review. [medium] BPM suspeito para aula: 24.<br>[medium] notes1Hand demora 20s para a primeira nota cair.<br>[medium] notes1Hand tem silencio interno longo de 20s.
- turkish-march: 16 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- fantasy-in-d-minormozart: 16 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- piano-sonata-in-c-major-kv-309-1st-part-mozart: 16 pontos, status review. [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.<br>[medium] notes2Hands tem duracoes curtas demais para leitura/score.
- doumkatchaikosvky: 12 pontos, status review. [medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
- fur-elise: 9 pontos, status review. [medium] arrangements.medium tem sobreposicao da mesma tecla antes da nota anterior terminar.<br>[medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Versao facil ainda parece dificil para iniciante.
- moonlight-sonata: 9 pontos, status review. [medium] notes1Hand demora 19s para a primeira nota cair.<br>[medium] notes1Hand tem silencio interno longo de 27s.<br>[medium] arrangements.easy demora 19s para a primeira nota cair.
- ode-to-joy: 7 pontos, status review. [medium] notes tem sobreposicao da mesma tecla antes da nota anterior terminar.<br>[medium] notes2Hands tem sobreposicao da mesma tecla antes da nota anterior terminar.<br>[medium] arrangements.hard tem sobreposicao da mesma tecla antes da nota anterior terminar.
- fugue-sur-le-nom-de-bachrimsky-korsakov: 7 pontos, status review. [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.<br>[low] notes tem notas sustentadas muito longas; precisa renderizar sustain corretamente.
- sonata-2bmoll-chopin: 7 pontos, status review. [medium] BPM suspeito para aula: 224.<br>[medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
- the-seasons-augusttchaikovsky: 6 pontos, status review. [medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
- toccata-and-fugue-d-minor: 6 pontos, status review. [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
- minueto-em-sol-maior: 5 pontos, status review. [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
- ciranda-cirandinha: 5 pontos, status review. [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.

## Tabela por musica

| ID | Titulo | Nivel catalogo | Nivel estimado | Easy estimado | Notas easy/hard | Acordes easy/hard | Densidade easy/hard | Status | Principais alertas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
borboletinha | Borboletinha | Fácil | profissional | intermediario | 44/102 | 1/5 | 114.78/266.09 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
pintinho-amarelinho | Meu Pintinho Amarelinho | Fácil | profissional | intermediario | 82/146 | 1/5 | 136.67/243.33 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
twinkle-twinkle | Brilha Brilha Estrelinha | Fácil | profissional | facil | 42/118 | 1/5 | 84/236 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
a-dona-aranha | A Dona Aranha | Fácil | profissional | intermediario | 47/113 | 1/5 | 100.71/242.14 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
ode-to-joy | Ode à Alegria | Médio | profissional | intermediario | 67/238 | 1/4 | 100.5/357 | review | [medium] notes tem sobreposicao da mesma tecla antes da nota anterior terminar.<br>[medium] notes2Hands tem sobreposicao da mesma tecla antes da nota anterior terminar.
fur-elise | Para Elisa | Médio | profissional | intermediario | 110/193 | 2/6 | 194.12/340.59 | review | [medium] arrangements.medium tem sobreposicao da mesma tecla antes da nota anterior terminar.<br>[medium] Marcacao de maos parece incoerente em parte das notas.
o-sapo-nao-lava-o-pe | O Sapo não Lava o Pé | Fácil | profissional | intermediario | 35/89 | 1/5 | 105/267 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
minueto-em-sol-maior | Minueto em Sol Maior | Médio | profissional | intermediario | 127/204 | 2/4 | 177.21/284.65 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
moonlight-sonata | Sonata ao Luar (1º Movimento) | Médio | profissional | facil | 109/1142 | 1/6 | 23.61/247.36 | review | [medium] notes1Hand demora 19s para a primeira nota cair.<br>[medium] notes1Hand tem silencio interno longo de 27s.
bach-prelude | Prelúdio em Dó Maior (BWV 846) | Médio | dificil | facil | 137/549 | 1/5 | 58.3/233.62 | review | [medium] Versao intermediaria pode estar dificil demais.
turkish-march | Marcha Turca | Difícil | profissional | dificil | 646/1614 | 3/8 | 151.41/378.28 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
minute-waltz | Valsa do Minuto (Op. 64 nº 1) | Difícil | profissional | dificil | 688/1370 | 2/5 | 453.63/903.3 | review | [medium] BPM suspeito para aula: 280.<br>[medium] notes tem duracoes curtas demais para leitura/score.
nocturne-op9 | Noturno Op. 9 nº 2 | Médio | profissional | intermediario | 421/1242 | 2/6 | 123.82/365.29 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
parabens-pra-voce | Parabéns pra Você | Fácil | profissional | facil | 25/57 | 1/5 | 93.75/213.75 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
ballade-4chopin | Balada nº 4 em Fá Menor | Difícil | profissional | profissional | 2104/6046 | 5/11 | 175.82/505.24 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
bella-ciao-lacasadepapel | Bella Ciao | Médio | profissional | intermediario | 80/144 | 1/5 | 111.63/200.93 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
ciranda-cirandinha | Ciranda, Cirandinha | Fácil | profissional | intermediario | 56/112 | 1/5 | 160/320 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
atirei-o-pau-no-gato | Atirei o Pau no Gato | Fácil | profissional | intermediario | 42/102 | 1/5 | 132.63/322.11 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
escravos-de-jo | Escravos de Jó | Fácil | dificil | intermediario | 64/127 | 1/4 | 160/317.5 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
peixe-vivo | Peixe Vivo | Fácil | profissional | intermediario | 80/178 | 1/5 | 145.45/323.64 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
fui-no-itororo | Fui no Itororó | Fácil | dificil | intermediario | 120/216 | 1/4 | 163.64/294.55 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
a-canoa-virou | A Canoa Virou | Fácil | profissional | intermediario | 50/114 | 1/5 | 142.86/325.71 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
o-cravo-e-a-rosa | O Cravo e a Rosa | Fácil | dificil | intermediario | 29/53 | 1/4 | 116/212 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
pirulito-que-bate-bate | Pirulito que Bate Bate | Fácil | profissional | intermediario | 64/96 | 1/5 | 202.11/303.16 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
samba-lele | Samba Lelê | Fácil | profissional | intermediario | 96/160 | 1/5 | 164.57/274.29 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
teresinha-de-jesus | Teresinha de Jesus | Fácil | dificil | intermediario | 29/55 | 1/4 | 108.75/206.25 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
carneirinho-carneirao | Carneirinho, Carneirão | Fácil | profissional | intermediario | 84/148 | 1/5 | 126/222 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
pai-francisco | Pai Francisco | Fácil | profissional | intermediario | 106/170 | 1/5 | 171.89/275.68 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
pezinho | Pezinho | Fácil | profissional | intermediario | 100/164 | 1/5 | 176.47/289.41 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
sapo-cururu | Sapo Cururu | Fácil | dificil | facil | 75/147 | 1/4 | 91.84/180 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
se-essa-rua-fosse-minha | Se Essa Rua Fosse Minha | Fácil | profissional | intermediario | 135/231 | 1/5 | 126.56/216.56 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
minha-machadinha | Minha Machadinha | Fácil | profissional | intermediario | 136/215 | 1/5 | 220.54/348.65 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
oh-que-belas-laranjas | Oh! Que Belas Laranjas | Fácil | profissional | intermediario | 136/200 | 1/5 | 226.67/333.33 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
passarinho-da-lagoa | Passarinho da Lagoa | Fácil | profissional | intermediario | 90/130 | 1/5 | 257.14/371.43 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
tutu-maramba | Tutu Marambá | Fácil | profissional | intermediario | 90/162 | 1/5 | 117.39/211.3 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
onde-esta-a-margarida | Onde Está a Margarida? | Fácil | profissional | intermediario | 108/188 | 1/5 | 150.7/262.33 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
amazing-grace | Amazing Grace | Fácil | profissional | facil | 35/82 | 1/5 | 63.64/149.09 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
castelo-forte | Castelo Forte | Médio | profissional | facil | 74/258 | 1/4 | 60.82/212.05 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
mais-perto-quero-estar | Mais Perto Quero Estar | Fácil | profissional | facil | 44/169 | 1/4 | 66/253.5 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
santo-santo-santo | Santo, Santo, Santo | Médio | profissional | facil | 54/200 | 1/4 | 49.85/184.62 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
noite-feliz | Noite Feliz | Fácil | profissional | facil | 46/173 | 1/4 | 74.59/280.54 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
rocha-eterna | Rocha Eterna | Fácil | profissional | intermediario | 42/158 | 1/4 | 109.57/412.17 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
vinde-fieis | Vinde Fieis | Fácil | profissional | facil | 67/213 | 1/4 | 49.63/157.78 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
o-vem-o-vem-emanuel | O Vem, O Vem, Emanuel | Médio | profissional | intermediario | 61/222 | 1/4 | 98.92/360 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
jubiloso-te-adoramos | Jubiloso, Te Adoramos | Médio | profissional | intermediario | 67/238 | 1/4 | 100.5/357 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
firme-nas-promessas | Firme nas Promessas | Médio | profissional | intermediario | 92/344 | 1/4 | 141.54/529.23 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
conta-as-bencaos | Conta as Bencaos | Médio | profissional | intermediario | 84/338 | 1/4 | 105/422.5 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
sou-feliz-com-jesus | Sou Feliz com Jesus | Médio | profissional | facil | 61/213 | 1/4 | 62.03/216.61 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
coroai | Coroai | Médio | profissional | facil | 54/202 | 1/4 | 81/303 | review | [medium] BPM suspeito para aula: 200.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
manso-e-suave | Manso e Suave | Fácil | profissional | facil | 71/269 | 1/4 | 59.17/224.17 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
aos-pes-da-cruz | Aos Pes da Cruz | Médio | profissional | intermediario | 71/274 | 1/4 | 96.82/373.64 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
alvo-mais-que-a-neve | Alvo Mais que a Neve | Fácil | profissional | facil | 65/250 | 1/4 | 86.67/333.33 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
chuvas-de-graca | Chuvas de Graca | Fácil | profissional | intermediario | 61/241 | 1/5 | 101.67/401.67 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
deus-velara-por-ti | Deus Velara por Ti | Fácil | profissional | facil | 62/225 | 1/4 | 93/337.5 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
gloria-gloria-aleluia | Gloria, Gloria, Aleluia | Médio | profissional | intermediario | 81/318 | 1/4 | 121.5/477 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
tao-sublime-sacramento | Tao Sublime Sacramento | Médio | profissional | facil | 56/214 | 1/4 | 42.53/162.53 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
chopin-fantaisie-impromptuchopin | Fantasia-Impromptu | Difícil | profissional | profissional | 1602/3014 | 5/6 | 376.94/709.18 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand demora 5.804s para a primeira nota cair.
das-wohltemperierte-clavier-ii-praeludium-iijsbach | O Cravo Bem Temperado II: Prelúdio II | Difícil | dificil | intermediario | 442/692 | 1/4 | 465.26/728.42 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
doumkatchaikosvky | Dumka | Difícil | profissional | intermediario | 1613/4279 | 2/8 | 168.61/447.28 | review | [medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Versao facil ainda parece dificil para iniciante.
etude-a-mollchopin | Estudo em Lá Menor | Difícil | profissional | intermediario | 766/1458 | 1/7 | 553.73/1053.98 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
fantasy-in-d-minormozart | Fantasia em Ré Menor | Difícil | profissional | dificil | 754/1511 | 4/6 | 158.74/318.11 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
fugue-in-e-flat-major-kv-153375fmozart | Fuga em Mi Bemol Maior, KV 153/375f | Difícil | profissional | intermediario | 557/1021 | 1/3 | 228.9/419.59 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
fugue-sur-le-nom-de-bachrimsky-korsakov | Fuga sobre o Nome de Bach | Difícil | profissional | intermediario | 375/619 | 1/4 | 180/297.12 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
fuguefragmentmozart | Fragmento de Fuga | Médio | profissional | intermediario | 197/339 | 1/4 | 203.79/350.69 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
gigue-in-g-majormozart | Giga em Sol Maior | Médio | profissional | intermediario | 192/457 | 1/5 | 230.4/548.4 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
march-of-the-wooden-soldierstchaikovsky | Marcha dos Soldadinhos de Madeira | Médio | profissional | intermediario | 126/318 | 1/4 | 180/454.29 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
marche-funebre-kv-453amozart | Marcha Fúnebre, KV 453a | Médio | profissional | facil | 77/266 | 1/6 | 72.19/249.38 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
morning-prayertchaikovsky | Oração da Manhã | Fácil | profissional | facil | 72/246 | 1/5 | 60.85/207.89 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
notteegiornomozart | Noite e Dia | Médio | profissional | dificil | 413/865 | 3/6 | 215.48/451.3 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
old-french-songtchaikosvky | Canção Francesa Antiga | Fácil | dificil | intermediario | 96/188 | 1/4 | 101.05/197.89 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
piano-sonata-in-c-major-kv-309-1st-part-mozart | Sonata para Piano em Dó Maior, KV 309 (1ª Parte) | Difícil | profissional | dificil | 991/2378 | 3/6 | 231.36/555.18 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
prelude-op-28-no-4-suffocation-chopin | Prelúdio Op. 28 nº 4 | Médio | profissional | facil | 79/600 | 1/7 | 43.09/327.27 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
preludio-chopin | Prelúdio Op. 45 | Difícil | profissional | intermediario | 739/1322 | 1/6 | 222.81/398.59 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
preludio-n-15-chopin | Prelúdio nº 15 | Difícil | profissional | dificil | 570/1517 | 2/7 | 127.61/339.63 | review | [medium] Versao facil ainda parece dificil para iniciante.
preludio-n-20-chopin | Prelúdio nº 20 | Médio | profissional | facil | 61/286 | 1/7 | 48.16/225.79 | review | [medium] BPM suspeito para aula: 42.<br>[low] Dificuldade do catalogo nao combina com a estimativa tecnica.
preludio-n-6-chopin | Prelúdio nº 6 | Médio | profissional | facil | 124/405 | 1/4 | 72.23/235.92 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
preludio-numero7chopin | Prelúdio nº 7 | Fácil | profissional | intermediario | 49/168 | 2/9 | 117.6/403.2 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
premiere-arabesquedebussy | Primeira Arabesca | Difícil | profissional | intermediario | 646/1444 | 1/7 | 217.75/486.74 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
sonata-2bmoll-chopin | Sonata nº 2 em Si Bemol Menor: Finale | Difícil | profissional | dificil | 902/1808 | 2/6 | 644.29/1291.43 | review | [medium] BPM suspeito para aula: 224.<br>[medium] Versao facil ainda parece dificil para iniciante.
sonata-in-c-major-fragment-mozart | Sonata em Dó Maior (Fragmento) | Médio | profissional | dificil | 174/382 | 3/6 | 267.69/587.69 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
suite-bergamasque-clair-de-lunedebussy | Clair de Lune | Difícil | profissional | facil | 304/1468 | 1/8 | 56.47/272.69 | review | [medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
the-seasons-augusttchaikovsky | As Estações: Agosto | Difícil | profissional | intermediario | 654/2442 | 1/8 | 118.19/441.33 | review | [medium] Marcacao de maos parece incoerente em parte das notas.<br>[medium] Versao facil ainda parece dificil para iniciante.
the-seasons-februarytchaikovsky | As Estações: Fevereiro | Difícil | profissional | intermediario | 637/1810 | 1/8 | 135.05/383.75 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Ha acordes/clusters muito densos; pode ser ruim para leitura e pontuacao.
the-seasons-januarytchaikovsky | As Estações: Janeiro | Difícil | profissional | intermediario | 639/1526 | 2/6 | 148.03/353.51 | review | [medium] Versao facil ainda parece dificil para iniciante.
trois-nouvelles-etudes-no-1-f-minorchopin | Três Novos Estudos nº 1 em Fá Menor | Difícil | profissional | intermediario | 344/821 | 1/5 | 127.41/304.07 | review | [medium] Versao facil ainda parece dificil para iniciante.
toccata-and-fugue-d-minor | Tocata e Fuga em Ré Menor | Difícil | profissional | dificil | 2377/3650 | 2/8 | 248.9/382.2 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
in-the-hall-of-the-mountain-king | Na Gruta do Rei da Montanha | Médio | profissional | dificil | 544/1453 | 4/9 | 213.33/569.8 | review | [medium] notes tem duracoes curtas demais para leitura/score.<br>[medium] notes1Hand tem duracoes curtas demais para leitura/score.
gymnopedie-no-1 | Gymnopédie nº 1 | Médio | profissional | facil | 92/282 | 1/7 | 38.87/119.15 | review | [low] Dificuldade do catalogo nao combina com a estimativa tecnica.
ave-maria-schubert | Ave Maria | Médio | profissional | intermediario | 312/651 | 2/3 | 43.43/90.63 | review | [medium] BPM suspeito para aula: 24.<br>[medium] notes1Hand demora 20s para a primeira nota cair.
swan-lake-napolitan-dance | Lago dos Cisnes: Dança Napolitana | Médio | profissional | intermediario | 248/775 | 1/5 | 165.33/516.67 | review | [medium] Versao facil ainda parece dificil para iniciante.<br>[medium] Versao intermediaria pode estar dificil demais.
