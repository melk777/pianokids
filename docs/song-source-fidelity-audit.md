# Auditoria de fidelidade musical contra MIDI fonte

Gerado em 2026-04-28T21:22:35.519Z.

Este relatorio compara os JSONs finais com os MIDIs locais em public/midi. Ele mede preservacao de melodia, contorno, baixo/harmonia, duracao e densidade. Nao substitui conferencia com partitura oficial, mas aponta desvios musicais provaveis usando a fonte local disponivel.

## Resumo

- Musicas analisadas: 90
- OK: 90
- Revisao: 0
- Precisa correcao: 0
- Issues: high=0, medium=0, low=0

## Prioridade

- borboletinha: ok. Sem alertas
- pintinho-amarelinho: ok. Sem alertas
- twinkle-twinkle: ok. Sem alertas
- a-dona-aranha: ok. Sem alertas
- ode-to-joy: ok. Sem alertas
- fur-elise: ok. Sem alertas
- o-sapo-nao-lava-o-pe: ok. Sem alertas
- minueto-em-sol-maior: ok. Sem alertas
- moonlight-sonata: ok. Sem alertas
- bach-prelude: ok. Sem alertas
- turkish-march: ok. Sem alertas
- minute-waltz: ok. Sem alertas
- nocturne-op9: ok. Sem alertas
- parabens-pra-voce: ok. Sem alertas
- ballade-4chopin: ok. Sem alertas
- bella-ciao-lacasadepapel: ok. Sem alertas
- ciranda-cirandinha: ok. Sem alertas
- atirei-o-pau-no-gato: ok. Sem alertas
- escravos-de-jo: ok. Sem alertas
- peixe-vivo: ok. Sem alertas
- fui-no-itororo: ok. Sem alertas
- a-canoa-virou: ok. Sem alertas
- o-cravo-e-a-rosa: ok. Sem alertas
- pirulito-que-bate-bate: ok. Sem alertas
- samba-lele: ok. Sem alertas

## Tabela

| ID | Titulo | MIDI fonte | Status | Hard melodia | Easy melodia | Easy contorno | Baixo | Duracao | Densidade hard | Alertas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
borboletinha | Borboletinha | borboletinha-1.mid | ok | 1 | 1 | 1 | 1 | 1.105 | 1.09 | ok
pintinho-amarelinho | Meu Pintinho Amarelinho | Meu_pintinho_amarelinho.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 1.159 | ok
twinkle-twinkle | Brilha Brilha Estrelinha | Brilha_Brilha_Estrelinha.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 0.97 | ok
a-dona-aranha | A Dona Aranha | A_DONA_ARANHA.mid | ok | 1 | 1 | 1 | 1 | 1.043 | 0.959 | ok
ode-to-joy | Ode à Alegria | ode_to_joy_full.mid | ok | 1 | 1 | 0.983 | 1 | 1.042 | 0.96 | ok
fur-elise | Para Elisa | Für_Elise_ DIFICIL–_Beethoven.mid | ok | 0.992 | 1 | 0.978 | 0.988 | 1.012 | 0.964 | ok
o-sapo-nao-lava-o-pe | O Sapo não Lava o Pé | o-sapo-2.mid | ok | 1 | 1 | 0.974 | 1 | 1.034 | 0.953 | ok
minueto-em-sol-maior | Minueto em Sol Maior | minueto-2.mid | ok | 1 | 1 | 1 | 1 | 1.01 | 0.967 | ok
moonlight-sonata | Sonata ao Luar (1º Movimento) | moonlight_sonata_dificil.mid | ok | 1 | 1 | 0.871 | 1 | 1.063 | 0.86 | ok
bach-prelude | Prelúdio em Dó Maior (BWV 846) | bach_prelude_full.mid | ok | 0.988 | 0.993 | 0.924 | 0.999 | 1.006 | 0.988 | ok
turkish-march | Marcha Turca | turkish_march_full.mid | ok | 0.958 | 0.914 | 0.898 | 0.997 | 1.004 | 0.912 | ok
minute-waltz | Valsa do Minuto (Op. 64 nº 1) | minute_waltz_full.mid | ok | 0.869 | 0.961 | 0.952 | 0.936 | 1.014 | 0.893 | ok
nocturne-op9 | Noturno Op. 9 nº 2 | nocturne_op9_full.mid | ok | 0.983 | 0.908 | 0.932 | 0.983 | 1.005 | 0.971 | ok
parabens-pra-voce | Parabéns pra Você | parabens-2.mid | ok | 1 | 1 | 1 | 1 | 1.104 | 0.79 | ok
ballade-4chopin | Balada nº 4 em Fá Menor | ballade-4chopin.mid | ok | 0.845 | 0.944 | 0.938 | 0.859 | 1.001 | 0.916 | ok
bella-ciao-lacasadepapel | Bella Ciao | bella-ciao-lacasadepapel.mid | ok | 0.926 | 0.883 | 1 | 1 | 1.013 | 0.888 | ok
ciranda-cirandinha | Ciranda, Cirandinha | ciranda_cirandinha.mid | ok | 1 | 0.956 | 0.978 | 0.746 | 1.016 | 0.389 | ok
atirei-o-pau-no-gato | Atirei o Pau no Gato | atirei_o_pau_no_gato.mid | ok | 0.855 | 0.761 | 0.88 | 0.696 | 1.013 | 0.314 | ok
escravos-de-jo | Escravos de Jó | escravos_de_jo.mid | ok | 0.942 | 0.937 | 0.987 | 0.786 | 1.022 | 0.385 | ok
peixe-vivo | Peixe Vivo | peixe_vivo.mid | ok | 0.794 | 0.817 | 0.915 | 0.855 | 1.029 | 0.832 | ok
fui-no-itororo | Fui no Itororó | fui_no_tororo.mid | ok | 0.977 | 0.882 | 0.924 | 0.933 | 1.016 | 0.724 | ok
a-canoa-virou | A Canoa Virou | a_canoa_virou.mid | ok | 0.951 | 0.938 | 0.937 | 1 | 1.026 | 0.975 | ok
o-cravo-e-a-rosa | O Cravo e a Rosa | o_cravo_e_a_rosa.mid | ok | 0.895 | 0.77 | 0.986 | 0.887 | 1.017 | 0.542 | ok
pirulito-que-bate-bate | Pirulito que Bate Bate | pirulito_que_bate_bate.mid | ok | 1 | 1 | 1 | 1 | 1.065 | 0.879 | ok
samba-lele | Samba Lelê | samba_lele.mid | ok | 0.842 | 0.818 | 0.862 | 0.897 | 1.03 | 0.951 | ok
teresinha-de-jesus | Teresinha de Jesus | teresinha_de_jesus.mid | ok | 0.985 | 0.916 | 0.864 | 0.838 | 1.02 | 0.535 | ok
carneirinho-carneirao | Carneirinho, Carneirão | carneirinho_carneirao.mid | ok | 0.993 | 1 | 0.988 | 1 | 1.018 | 0.964 | ok
pai-francisco | Pai Francisco | pai_francisco.mid | ok | 0.892 | 0.916 | 0.78 | 0.967 | 1.015 | 0.589 | ok
pezinho | Pezinho | pezinho.mid | ok | 1 | 1 | 0.989 | 1 | 1.025 | 0.437 | ok
sapo-cururu | Sapo Cururu | sapo_cururu.mid | ok | 0.919 | 0.889 | 0.818 | 1 | 1.028 | 0.927 | ok
se-essa-rua-fosse-minha | Se Essa Rua Fosse Minha | se_essa_rua_fosse_minha.mid | ok | 0.993 | 1 | 0.979 | 0.805 | 1.022 | 0.399 | ok
minha-machadinha | Minha Machadinha | minha_machadinha.mid | ok | 0.993 | 1 | 1 | 1 | 1.03 | 0.772 | ok
oh-que-belas-laranjas | Oh! Que Belas Laranjas | oh_que_belas_laranjas.mid | ok | 0.917 | 1 | 0.613 | 1 | 1.045 | 0.801 | ok
passarinho-da-lagoa | Passarinho da Lagoa | passarinho_da_lagoa.mid | ok | 1 | 1 | 0.867 | 1 | 1.088 | 0.919 | ok
tutu-maramba | Tutu Marambá | tutu_maramba.mid | ok | 1 | 1 | 0.952 | 1 | 1.034 | 0.967 | ok
onde-esta-a-margarida | Onde Está a Margarida? | onde_esta_a_margarida.mid | ok | 0.937 | 0.931 | 0.96 | 0.951 | 1.008 | 0.607 | ok
amazing-grace | Amazing Grace | amazing_grace.mid | ok | 1 | 1 | 1 | 1 | 1.048 | 0.872 | ok
castelo-forte | Castelo Forte | castelo_forte.mid | ok | 1 | 1 | 1 | 1 | 1.032 | 0.874 | ok
mais-perto-quero-estar | Mais Perto Quero Estar | mais_perto_quero_estar.mid | ok | 1 | 1 | 1 | 1 | 1.042 | 0.855 | ok
santo-santo-santo | Santo, Santo, Santo | santo_santo_santo.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 0.935 | ok
noite-feliz | Noite Feliz | noite_feliz.mid | ok | 0.978 | 1 | 1 | 1 | 1.045 | 0.902 | ok
rocha-eterna | Rocha Eterna | rocha_eterna.mid | ok | 1 | 1 | 1 | 1 | 1.042 | 0.914 | ok
vinde-fieis | Vinde Fieis | vinde_fieis.mid | ok | 1 | 1 | 1 | 1 | 1.021 | 0.937 | ok
o-vem-o-vem-emanuel | O Vem, O Vem, Emanuel | o_vem_o_vem_emanuel.mid | ok | 1 | 1 | 1 | 1 | 1.021 | 0.919 | ok
jubiloso-te-adoramos | Jubiloso, Te Adoramos | jubiloso_te_adoramos.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 0.923 | ok
firme-nas-promessas | Firme nas Promessas | firme_nas_promessas.mid | ok | 1 | 1 | 1 | 1 | 1.035 | 0.949 | ok
conta-as-bencaos | Conta as Bencaos | conta_as_bencaos.mid | ok | 1 | 1 | 1 | 1 | 1.04 | 0.951 | ok
sou-feliz-com-jesus | Sou Feliz com Jesus | sou_feliz_com_jesus.mid | ok | 1 | 1 | 1 | 1 | 1.016 | 0.962 | ok
coroai | Coroai | coroai.mid | ok | 1 | 1 | 1 | 1 | 1.042 | 0.909 | ok
manso-e-suave | Manso e Suave | manso_e_suave.mid | ok | 1 | 1 | 1 | 1 | 1.016 | 0.973 | ok
aos-pes-da-cruz | Aos Pes da Cruz | aos_pes_da_cruz.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 0.916 | ok
alvo-mais-que-a-neve | Alvo Mais que a Neve | alvo_mais_que_a_neve.mid | ok | 0.834 | 0.878 | 0.909 | 0.586 | 0.999 | 0.584 | ok
chuvas-de-graca | Chuvas de Graca | chuvas_de_graca.mid | ok | 1 | 1 | 1 | 1 | 1.007 | 0.591 | ok
deus-velara-por-ti | Deus Velara por Ti | deus_velara_por_ti.mid | ok | 0.967 | 0.946 | 0.87 | 1 | 1.002 | 0.733 | ok
gloria-gloria-aleluia | Gloria, Gloria, Aleluia | gloria_gloria_aleluia.mid | ok | 0.815 | 0.833 | 1 | 0.963 | 1.056 | 0.684 | ok
tao-sublime-sacramento | Tao Sublime Sacramento | tao_sublime_sacramento.mid | ok | 0.977 | 0.992 | 1 | 0.99 | 1.013 | 0.55 | ok
chopin-fantaisie-impromptuchopin | Fantasia-Impromptu | chopin_fantaisie-impromptuchopin.mid | ok | 0.945 | 0.928 | 0.897 | 0.859 | 1.006 | 0.915 | ok
das-wohltemperierte-clavier-ii-praeludium-iijsbach | O Cravo Bem Temperado II: Prelúdio II | Das Wohltemperierte Clavier II, Praeludium IIJSBACH.mid | ok | 1 | 1 | 0.966 | 1 | 1.018 | 0.981 | ok
doumkatchaikosvky | Dumka | DoumkaTchaikosvky.mid | ok | 0.756 | 0.868 | 0.91 | 0.807 | 1.003 | 0.847 | ok
etude-a-mollchopin | Estudo em Lá Menor | Etüde a-mollChopin.mid | ok | 0.896 | 0.898 | 0.855 | 0.906 | 1.016 | 0.684 | ok
fantasy-in-d-minormozart | Fantasia em Ré Menor | Fantasy in D minormozart.mid | ok | 0.916 | 0.919 | 0.951 | 0.916 | 1.006 | 0.95 | ok
fugue-in-e-flat-major-kv-153375fmozart | Fuga em Mi Bemol Maior, KV 153/375f | Fugue in E-flat Major KV 153375fmozart.mid | ok | 0.989 | 0.995 | 0.89 | 0.998 | 1.013 | 0.982 | ok
fugue-sur-le-nom-de-bachrimsky-korsakov | Fuga sobre o Nome de Bach | Fugue sur le nom de BachRimsky-Korsakov.mid | ok | 1 | 1 | 0.887 | 1 | 1.013 | 0.979 | ok
fuguefragmentmozart | Fragmento de Fuga | fuguefragmentmozart.mid | ok | 1 | 1 | 0.97 | 1 | 1.022 | 0.978 | ok
gigue-in-g-majormozart | Giga em Sol Maior | Gigue in G Majormozart.mid | ok | 0.978 | 1 | 0.92 | 0.996 | 1.023 | 0.945 | ok
march-of-the-wooden-soldierstchaikovsky | Marcha dos Soldadinhos de Madeira | March of the Wooden SoldiersTchaikovsky.mid | ok | 1 | 1 | 1 | 0.901 | 1.037 | 0.785 | ok
marche-funebre-kv-453amozart | Marcha Fúnebre, KV 453a | Marche funebre KV 453amozart.mid | ok | 0.979 | 0.968 | 0.967 | 0.968 | 1.016 | 0.947 | ok
morning-prayertchaikovsky | Oração da Manhã | Morning PrayerTchaikovsky.mid | ok | 0.979 | 0.969 | 0.968 | 1 | 1.019 | 0.949 | ok
notteegiornomozart | Noite e Dia | NotteEGiornomozart.mid | ok | 0.885 | 0.921 | 0.98 | 0.926 | 1.014 | 0.836 | ok
old-french-songtchaikosvky | Canção Francesa Antiga | Old French SongTchaikosvky.mid | ok | 1 | 1 | 1 | 1 | 1.031 | 0.965 | ok
piano-sonata-in-c-major-kv-309-1st-part-mozart | Sonata para Piano em Dó Maior, KV 309 (1ª Parte) | Piano Sonata in C Major - KV 309 (1st Part)mozart.mid | ok | 0.963 | 0.966 | 0.947 | 0.992 | 1.005 | 0.945 | ok
prelude-op-28-no-4-suffocation-chopin | Prelúdio Op. 28 nº 4 | Prelude Op. 28, No. 4 ('Suffocation')Chopin.mid | ok | 0.775 | 0.828 | 0.989 | 0.995 | 1.017 | 0.861 | ok
preludio-chopin | Prelúdio de Chopin | preludio chopin.mid | ok | 0.976 | 0.976 | 0.906 | 0.996 | 1.008 | 0.966 | ok
preludio-n-15-chopin | Prelúdio nº 15 | Preludio n 15 chopin.mid | ok | 0.94 | 0.881 | 1 | 0.997 | 1.004 | 0.911 | ok
preludio-n-20-chopin | Prelúdio nº 20 | preludio n 20 chopin.mid | ok | 1 | 1 | 1 | 1 | 1.023 | 0.783 | ok
preludio-n-6-chopin | Prelúdio nº 6 | preludio n 6 chopin.mid | ok | 0.995 | 1 | 1 | 0.995 | 1.016 | 0.981 | ok
preludio-numero7chopin | Prelúdio nº 7 | preludio numero7chopin.mid | ok | 0.938 | 0.958 | 1 | 1 | 1.042 | 0.931 | ok
premiere-arabesquedebussy | Primeira Arabesca | Première ArabesqueDebussy.mid | ok | 0.775 | 0.979 | 0.963 | 0.772 | 1.01 | 0.953 | ok
sonata-2bmoll-chopin | Sonata nº 2 em Si Bemol Menor | sonata 2bmoll chopin.mid | ok | 0.827 | 0.736 | 0.858 | 0.896 | 1.018 | 0.795 | ok
sonata-in-c-major-fragment-mozart | Sonata em Dó Maior (Fragmento) | Sonata in C major (fragment)mozart.mid | ok | 0.992 | 1 | 0.873 | 1 | 1.04 | 0.957 | ok
suite-bergamasque-clair-de-lunedebussy | Clair de Lune | Suite Bergamasque Clair de Lunedebussy.mid | ok | 0.958 | 0.954 | 0.901 | 0.958 | 1.003 | 0.915 | ok
the-seasons-augusttchaikovsky | As Estações: Agosto | The Seasons AugustTchaikovsky.mid | ok | 0.965 | 0.956 | 0.849 | 0.979 | 1.004 | 0.926 | ok
the-seasons-februarytchaikovsky | As Estações: Fevereiro | The Seasons FebruaryTchaikovsky.mid | ok | 0.986 | 0.991 | 0.91 | 0.993 | 1.006 | 0.957 | ok
the-seasons-januarytchaikovsky | As Estações: Janeiro | The Seasons JanuaryTchaikovsky.mid | ok | 0.882 | 0.943 | 0.986 | 0.883 | 1.006 | 0.974 | ok
trois-nouvelles-etudes-no-1-f-minorchopin | Três Novos Estudos nº 1 em Fá Menor | Trois Nouvelles Etudes, No. 1 F MinorChopin.mid | ok | 0.876 | 1 | 0.936 | 1 | 1.01 | 0.989 | ok
toccata-and-fugue-d-minor | Tocata e Fuga em Ré Menor | toccata_fugue_d_minor.mid | ok | 0.863 | 0.952 | 0.961 | 0.867 | 1.002 | 0.973 | ok
in-the-hall-of-the-mountain-king | Na Gruta do Rei da Montanha | in_the_hall_of_the_mountain_king.mid | ok | 0.79 | 0.829 | 0.877 | 0.878 | 1.012 | 0.808 | ok
gymnopedie-no-1 | Gymnopédie nº 1 | gymnopedie_no_1.mid | ok | 1 | 1 | 0.991 | 1 | 1.007 | 0.965 | ok
ave-maria-schubert | Ave Maria | ave_maria_schubert.mid | ok | 0.66 | 0.964 | 0.991 | 0.626 | 1.002 | 0.743 | ok
swan-lake-napolitan-dance | Lago dos Cisnes: Dança Napolitana | swan_lake_napolitan_dance.mid | ok | 1 | 1 | 1 | 1 | 1.021 | 0.971 | ok
