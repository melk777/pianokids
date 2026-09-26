# Capas ilustradas dos hinos da onda 5

Os 22 hinos adicionados em setembro de 2026 têm capas vetoriais geradas por
`scripts/generate-religious-covers.js`. Para que fiquem no mesmo padrão das
ilustrações dos outros hinos, gere uma imagem por hino com os prompts abaixo.

## Como aplicar

1. Gere a imagem quadrada (1:1, idealmente 1254 × 1254 px) na mesma ferramenta
   usada para as capas atuais.
2. Salve como PNG em `public/images/covers/religiosos/<id>.png`, usando o `id`
   de cada hino abaixo.
3. Rode `node scripts/build-song-catalog-index.js` (o `npm run build` já faz isso).
   O PNG tem prioridade sobre o SVG, então a capa ilustrada entra no lugar da
   vetorial sem mudar código.

## Estilo comum (cole antes de cada prompt)

> Pintura digital cinematográfica, ultra detalhada, iluminação dourada quente,
> um piano de cauda preto brilhante em primeiro plano, notas musicais douradas
> luminosas flutuando em espiral com partículas de luz, atmosfera reverente e
> esperançosa, composição quadrada 1:1, sem texto, sem letras, sem logotipos,
> mesmo estilo das capas "Rocha Eterna", "Castelo Forte" e "Noite Feliz" da Pianify.

## Prompts por hino

| id | Hino | Cena |
| --- | --- | --- |
| `que-seguranca` | Que Segurança | Piano sobre um cais de pedra ao pôr do sol, uma âncora dourada ao lado, mar calmo e céu aberto com raios de luz. |
| `a-deus-demos-gloria` | A Deus Demos Glória | Piano no alto de uma colina ao amanhecer, raios de sol atravessando nuvens douradas, campos em flor. |
| `alegria-ao-mundo` | Alegria ao Mundo | Piano numa praça de vila coberta de neve à noite, luzes festivas, estrela brilhante no céu, pessoas celebrando ao longe. |
| `eis-dos-anjos-a-harmonia` | Eis dos Anjos a Harmonia | Piano num campo de pastores à noite, céu estrelado com brilho celestial suave e silhuetas de anjos em luz. |
| `vem-tu-onipotente` | Vem, Tu, Onipotente | Piano num salão de catedral com vitrais iluminados, feixes de luz colorida caindo sobre o piano. |
| `o-deus-nosso-socorro` | Ó Deus, Nosso Socorro | Piano sob uma grande árvore antiga ao entardecer, tempestade se afastando no horizonte e céu clareando. |
| `guiado-pela-mao` | Guiado pela Mão | Piano no início de uma trilha iluminada entre montanhas verdes, caminho de luz dourada seguindo ao horizonte. |
| `formoso-senhor-jesus` | Formoso Senhor Jesus | Piano num jardim florido na primavera, flores e borboletas, luz suave da manhã. |
| `o-primeiro-natal` | O Primeiro Natal | Piano numa colina à noite com vista para uma pequena vila, grande estrela no céu, ovelhas ao longe. |
| `junto-ao-rio` | Junto ao Rio | Piano à margem de um rio cristalino entre árvores, reflexos dourados na água ao pôr do sol. |
| `louvai-ao-senhor-rei-poderoso` | Louvai ao Senhor, Rei Poderoso | Piano num terraço de palácio com colunas, trombetas e estandartes dourados, céu majestoso. |
| `sou-teu-senhor` | Sou Teu, Senhor | Piano numa capela simples de madeira, porta aberta para a luz, velas acesas. |
| `mais-amor-a-ti` | Mais Amor a Ti | Piano num campo de rosas ao entardecer, pétalas flutuando entre as notas douradas. |
| `mil-linguas-eu-quisera-ter` | Mil Línguas Eu Quisera Ter | Piano num anfiteatro ao ar livre, multidão de silhuetas cantando, céu vibrante ao pôr do sol. |
| `tal-qual-estou` | Tal Qual Estou | Piano numa sala silenciosa iluminada por uma janela, luz suave, uma cruz simples na parede. |
| `minha-fe-contempla-a-ti` | Minha Fé Contempla a Ti | Piano diante de uma colina com uma cruz ao longe, céu de amanhecer abrindo em luz. |
| `anjos-das-alturas` | Anjos das Alturas | Piano entre nuvens altas iluminadas, céu azul profundo e luzes celestiais suaves. |
| `como-um-pastor` | Como um Pastor | Piano num campo verde com ovelhas pastando, cajado de pastor apoiado no piano, luz da tarde. |
| `abre-meus-olhos` | Abre Meus Olhos | Piano numa sala escura com uma janela se abrindo para um amanhecer brilhante, luz invadindo o ambiente. |
| `jesus-chama` | Jesus Chama | Piano à beira do mar da Galileia, barcos de pesca ao amanhecer, águas calmas douradas. |
| `doxologia` | Doxologia | Piano em uma catedral gótica grandiosa, órgão ao fundo, luz dourada descendo do alto. |
| `comigo-habita` | Comigo Habita | Piano num jardim ao entardecer com lanternas acesas, céu lilás e uma pomba branca em voo. |
