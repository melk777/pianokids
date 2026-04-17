import borboletinhaData from "../../public/songs/borboletinha.json";
import pintinhoMidiData from "../../public/songs/meu-pintinho-amarelinho.json";
import twinkleMidiData from "../../public/songs/brilha-brilha-estrelinha.json";
import aDonaAranhaData from "../../public/songs/a-dona-aranha.json";
import odeMidiData from "../../public/songs/ode-to-joy.json";
import furEliseMidiData from "../../public/songs/fur-elise.json";
import oSapoData from "../../public/songs/o-sapo.json";
import minuetoData from "../../public/songs/minueto.json";
import moonlightSonataData from "../../public/songs/moonlight-sonata.json";
import bachPreludeData from "../../public/songs/bach-prelude.json";
import turkishMarchData from "../../public/songs/turkish-march.json";
import minuteWaltzData from "../../public/songs/minute-waltz.json";
import nocturneOp9Data from "../../public/songs/nocturne-op9.json";
import goldenHourData from "../../public/songs/golden-hour.json";
import parabensData from "../../public/songs/parabens.json";
import ballade4Data from "../../public/songs/ballade-4chopin.json";
import bellaCiaoData from "../../public/songs/bella-ciao-lacasadepapel.json";
import cirandaCirandinhaData from "../../public/songs/ciranda-cirandinha.json";
import atireiPauNoGatoData from "../../public/songs/atirei-o-pau-no-gato.json";
import escravosDeJoData from "../../public/songs/escravos-de-jo.json";
import peixeVivoData from "../../public/songs/peixe-vivo.json";
import fuiNoItororoData from "../../public/songs/fui-no-itororo.json";
import aCanoaVirouData from "../../public/songs/a-canoa-virou.json";
import oCravoERosaData from "../../public/songs/o-cravo-e-a-rosa.json";
import pirulitoData from "../../public/songs/pirulito-que-bate-bate.json";
import sambaLeleData from "../../public/songs/samba-lele.json";
import terezinhaDeJesusData from "../../public/songs/teresinha-de-jesus.json";
import carneirinhoData from "../../public/songs/carneirinho-carneirao.json";
import paiFranciscoData from "../../public/songs/pai-francisco.json";
import pezinhoData from "../../public/songs/pezinho.json";
import sapoCururuData from "../../public/songs/sapo-cururu.json";
import seEssaRuaData from "../../public/songs/se-essa-rua-fosse-minha.json";
import minhaMachadinhaData from "../../public/songs/minha-machadinha.json";
import ohQueBelasLaranjasData from "../../public/songs/oh-que-belas-laranjas.json";
import passarinhoDaLagoaData from "../../public/songs/passarinho-da-lagoa.json";
import tutuMarambaData from "../../public/songs/tutu-maramba.json";
import ondeEstaMargaridaData from "../../public/songs/onde-esta-a-margarida.json";
import fantaisieImpromptuData from "../../public/songs/chopin-fantaisie-impromptuchopin.json";
import wtcPrelude2Data from "../../public/songs/das-wohltemperierte-clavier-ii-praeludium-iijsbach.json";
import doumkaData from "../../public/songs/doumkatchaikosvky.json";
import etudeAMinorData from "../../public/songs/etude-a-mollchopin.json";
import fantasyDMinorData from "../../public/songs/fantasy-in-d-minormozart.json";
import fugueEbData from "../../public/songs/fugue-in-e-flat-major-kv-153375fmozart.json";
import fugueBachNameData from "../../public/songs/fugue-sur-le-nom-de-bachrimsky-korsakov.json";
import fugueFragmentData from "../../public/songs/fuguefragmentmozart.json";
import gigueGMajorData from "../../public/songs/gigue-in-g-majormozart.json";
import marchWoodenSoldiersData from "../../public/songs/march-of-the-wooden-soldierstchaikovsky.json";
import marcheFunebreData from "../../public/songs/marche-funebre-kv-453amozart.json";
import morningPrayerData from "../../public/songs/morning-prayertchaikovsky.json";
import notteEGiornoData from "../../public/songs/notteegiornomozart.json";
import oldFrenchSongData from "../../public/songs/old-french-songtchaikosvky.json";
import pianoSonata309Data from "../../public/songs/piano-sonata-in-c-major-kv-309-1st-part-mozart.json";
import preludeOp28No4Data from "../../public/songs/prelude-op-28-no-4-suffocation-chopin.json";
import preludioData from "../../public/songs/preludio-chopin.json";
import preludio15Data from "../../public/songs/preludio-n-15-chopin.json";
import preludio20Data from "../../public/songs/preludio-n-20-chopin.json";
import preludio6Data from "../../public/songs/preludio-n-6-chopin.json";
import preludio7Data from "../../public/songs/preludio-numero7chopin.json";
import premiereArabesqueData from "../../public/songs/premiere-arabesquedebussy.json";
import sonata2Data from "../../public/songs/sonata-2bmoll-chopin.json";
import sonataFragmentData from "../../public/songs/sonata-in-c-major-fragment-mozart.json";
import clairDeLuneData from "../../public/songs/suite-bergamasque-clair-de-lunedebussy.json";
import seasonsAugustData from "../../public/songs/the-seasons-augusttchaikovsky.json";
import seasonsFebruaryData from "../../public/songs/the-seasons-februarytchaikovsky.json";
import seasonsJanuaryData from "../../public/songs/the-seasons-januarytchaikovsky.json";
import troisEtudesData from "../../public/songs/trois-nouvelles-etudes-no-1-f-minorchopin.json";

import { Song } from "@/lib/types";
export type { Song, SongNote, ArrangementLevel, SongArrangements } from "@/lib/types";

const COVER_CHOPIN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/Fr%C3%A9d%C3%A9ric_Chopin.jpg";
const COVER_BACH = "https://upload.wikimedia.org/wikipedia/commons/6/6a/Johann_Sebastian_Bach.jpg";
const COVER_MOZART = "https://upload.wikimedia.org/wikipedia/commons/f/fc/Barbara_Krafft_-_Portr%C3%A4t_Wolfgang_Amadeus_Mozart_%281819%29.jpg";
const COVER_TCHAIKOVSKY = "https://upload.wikimedia.org/wikipedia/commons/d/db/Tchaikovsky%2C_head-and-shoulders_portrait.jpg";
const COVER_DEBUSSY = "https://upload.wikimedia.org/wikipedia/commons/1/12/Claude_Debussy_portrait.jpg";
const COVER_RIMSKY = "https://upload.wikimedia.org/wikipedia/commons/a/aa/Nikolai_A._Rimsky-Korsakov.jpg";
const COVER_BEETHOVEN = "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg";
const infantisCover = (id: string) => `/images/covers/infantis/${id}.svg`;

export const songs: Song[] = [
  {
    ...(borboletinhaData as Song),
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("borboletinha"),
    difficulty: "Fácil",
  },
  {
    ...(pintinhoMidiData as Song),
    id: "pintinho-amarelinho",
    title: "Meu Pintinho Amarelinho",
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("meu-pintinho-amarelinho"),
    difficulty: "Fácil",
  },
  {
    ...(twinkleMidiData as Song),
    id: "twinkle-twinkle",
    title: "Brilha Brilha Estrelinha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("brilha-brilha-estrelinha"),
    difficulty: "Fácil",
  },
  {
    ...(aDonaAranhaData as Song),
    id: "a-dona-aranha",
    title: "A Dona Aranha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("a-dona-aranha"),
    difficulty: "Fácil",
  },
  {
    ...(odeMidiData as Song),
    id: "ode-to-joy",
    title: "Ode à Alegria",
    artist: "Ludwig van Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BEETHOVEN,
    difficulty: "Médio",
  },
  {
    ...(furEliseMidiData as Song),
    id: "fur-elise",
    title: "Para Elisa",
    artist: "Ludwig van Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BEETHOVEN,
    difficulty: "Médio",
  },
  {
    id: "evidencias",
    title: "Evidências",
    artist: "Chitãozinho & Xororó",
    category: "Sertanejos",
    isPremium: true,
    difficulty: "Médio",
    bpm: 90,
    duration: 120,
    coverUrl: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=500&auto=format&fit=crop&q=60",
    notes: [],
  },
  {
    id: "hallelujah",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    category: "Religiosos",
    isPremium: true,
    difficulty: "Fácil",
    bpm: 60,
    duration: 180,
    coverUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=500&auto=format&fit=crop&q=60",
    notes: [],
  },
  {
    id: "flowers",
    title: "Flowers",
    artist: "Miley Cyrus",
    category: "Grandes Sucessos",
    isPremium: true,
    difficulty: "Médio",
    bpm: 112,
    duration: 200,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60",
    notes: [],
  },
  {
    ...(oSapoData as Song),
    id: "o-sapo-nao-lava-o-pe",
    title: "O Sapo não Lava o Pé",
    artist: "Folclore Brasileiro",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("o-sapo"),
    difficulty: "Fácil",
  },
  {
    ...(minuetoData as Song),
    id: "minueto-em-sol-maior",
    title: "Minueto em Sol Maior",
    artist: "Johann Sebastian Bach",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BACH,
    difficulty: "Médio",
  },
  {
    ...(goldenHourData as Song),
    id: "golden-hour",
    title: "Golden Hour",
    artist: "JVKE",
    category: "Grandes Sucessos",
    isPremium: true,
    coverUrl: "/images/covers/golden_hour_cover.png",
    difficulty: "Médio",
  },
  {
    ...(parabensData as Song),
    id: "parabens-pra-voce",
    title: "Parabéns pra Você",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("parabens"),
    difficulty: "Fácil",
  },
  {
    ...(bellaCiaoData as Song),
    id: "bella-ciao-lacasadepapel",
    title: "Bella Ciao",
    artist: "La Casa de Papel (Intro)",
    category: "Intro de Filmes",
    categories: ["Infantis", "Intro de Filmes"],
    isPremium: false,
    coverUrl: "/images/covers/golden-hour.png",
    difficulty: "Médio",
  },
  {
    ...(cirandaCirandinhaData as Song),
    id: "ciranda-cirandinha",
    title: "Ciranda, Cirandinha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("ciranda-cirandinha"),
    difficulty: "Fácil",
  },
  {
    ...(atireiPauNoGatoData as Song),
    id: "atirei-o-pau-no-gato",
    title: "Atirei o Pau no Gato",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("atirei-o-pau-no-gato"),
    difficulty: "Fácil",
  },
  {
    ...(escravosDeJoData as Song),
    id: "escravos-de-jo",
    title: "Escravos de Jó",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("escravos-de-jo"),
    difficulty: "Fácil",
  },
  {
    ...(peixeVivoData as Song),
    id: "peixe-vivo",
    title: "Peixe Vivo",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("peixe-vivo"),
    difficulty: "Fácil",
  },
  {
    ...(fuiNoItororoData as Song),
    id: "fui-no-itororo",
    title: "Fui no Itororó",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("fui-no-itororo"),
    difficulty: "Fácil",
  },
  {
    ...(aCanoaVirouData as Song),
    id: "a-canoa-virou",
    title: "A Canoa Virou",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("a-canoa-virou"),
    difficulty: "Fácil",
  },
  {
    ...(oCravoERosaData as Song),
    id: "o-cravo-e-a-rosa",
    title: "O Cravo e a Rosa",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("o-cravo-e-a-rosa"),
    difficulty: "Fácil",
  },
  {
    ...(pirulitoData as Song),
    id: "pirulito-que-bate-bate",
    title: "Pirulito que Bate Bate",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("pirulito-que-bate-bate"),
    difficulty: "Fácil",
  },
  {
    ...(sambaLeleData as Song),
    id: "samba-lele",
    title: "Samba Lelê",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("samba-lele"),
    difficulty: "Fácil",
  },
  {
    ...(terezinhaDeJesusData as Song),
    id: "teresinha-de-jesus",
    title: "Teresinha de Jesus",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("teresinha-de-jesus"),
    difficulty: "Fácil",
  },
  {
    ...(carneirinhoData as Song),
    id: "carneirinho-carneirao",
    title: "Carneirinho, Carneirão",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("carneirinho-carneirao"),
    difficulty: "Fácil",
  },
  {
    ...(paiFranciscoData as Song),
    id: "pai-francisco",
    title: "Pai Francisco",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("pai-francisco"),
    difficulty: "Fácil",
  },
  {
    ...(pezinhoData as Song),
    id: "pezinho",
    title: "Pezinho",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("pezinho"),
    difficulty: "Fácil",
  },
  {
    ...(sapoCururuData as Song),
    id: "sapo-cururu",
    title: "Sapo Cururu",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("sapo-cururu"),
    difficulty: "Fácil",
  },
  {
    ...(seEssaRuaData as Song),
    id: "se-essa-rua-fosse-minha",
    title: "Se Essa Rua Fosse Minha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("se-essa-rua-fosse-minha"),
    difficulty: "Fácil",
  },
  {
    ...(minhaMachadinhaData as Song),
    id: "minha-machadinha",
    title: "Minha Machadinha",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("minha-machadinha"),
    difficulty: "Fácil",
  },
  {
    ...(ohQueBelasLaranjasData as Song),
    id: "oh-que-belas-laranjas",
    title: "Oh! Que Belas Laranjas",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("oh-que-belas-laranjas"),
    difficulty: "Fácil",
  },
  {
    ...(passarinhoDaLagoaData as Song),
    id: "passarinho-da-lagoa",
    title: "Passarinho da Lagoa",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("passarinho-da-lagoa"),
    difficulty: "Fácil",
  },
  {
    ...(tutuMarambaData as Song),
    id: "tutu-maramba",
    title: "Tutu Marambá",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("tutu-maramba"),
    difficulty: "Fácil",
  },
  {
    ...(ondeEstaMargaridaData as Song),
    id: "onde-esta-a-margarida",
    title: "Onde Está a Margarida?",
    artist: "Tradicional",
    category: "Infantis",
    isPremium: false,
    coverUrl: infantisCover("onde-esta-a-margarida"),
    difficulty: "Fácil",
  },
  {
    ...(moonlightSonataData as Song),
    id: "moonlight-sonata",
    title: "Sonata ao Luar (1º Movimento)",
    artist: "Ludwig van Beethoven",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BEETHOVEN,
    difficulty: "Médio",
  },
  {
    ...(bachPreludeData as Song),
    id: "bach-prelude",
    title: "Prelúdio em Dó Maior (BWV 846)",
    artist: "Johann Sebastian Bach",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BACH,
    difficulty: "Médio",
  },
  {
    ...(turkishMarchData as Song),
    id: "turkish-march",
    title: "Marcha Turca",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Difícil",
  },
  {
    ...(minuteWaltzData as Song),
    id: "minute-waltz",
    title: "Valsa do Minuto (Op. 64 nº 1)",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(nocturneOp9Data as Song),
    id: "nocturne-op9",
    title: "Noturno Op. 9 nº 2",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Médio",
  },
  {
    ...(ballade4Data as Song),
    title: "Balada nº 4 em Fá Menor",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(fantaisieImpromptuData as Song),
    title: "Fantasia-Impromptu",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(wtcPrelude2Data as Song),
    title: "O Cravo Bem Temperado II: Prelúdio II",
    artist: "Johann Sebastian Bach",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_BACH,
    difficulty: "Difícil",
  },
  {
    ...(doumkaData as Song),
    title: "Dumka",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Difícil",
  },
  {
    ...(etudeAMinorData as Song),
    title: "Estudo em Lá Menor",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(fantasyDMinorData as Song),
    title: "Fantasia em Ré Menor",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Difícil",
  },
  {
    ...(fugueEbData as Song),
    title: "Fuga em Mi Bemol Maior, KV 153/375f",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Difícil",
  },
  {
    ...(fugueBachNameData as Song),
    title: "Fuga sobre o Nome de Bach",
    artist: "Nikolai Rimsky-Korsakov",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_RIMSKY,
    difficulty: "Difícil",
  },
  {
    ...(fugueFragmentData as Song),
    title: "Fragmento de Fuga",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Médio",
  },
  {
    ...(gigueGMajorData as Song),
    title: "Giga em Sol Maior",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Médio",
  },
  {
    ...(marchWoodenSoldiersData as Song),
    title: "Marcha dos Soldadinhos de Madeira",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Médio",
  },
  {
    ...(marcheFunebreData as Song),
    title: "Marcha Fúnebre, KV 453a",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Médio",
  },
  {
    ...(morningPrayerData as Song),
    title: "Oração da Manhã",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Fácil",
  },
  {
    ...(notteEGiornoData as Song),
    title: "Noite e Dia",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Médio",
  },
  {
    ...(oldFrenchSongData as Song),
    title: "Canção Francesa Antiga",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Fácil",
  },
  {
    ...(pianoSonata309Data as Song),
    title: "Sonata para Piano em Dó Maior, KV 309 (1ª Parte)",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Difícil",
  },
  {
    ...(preludeOp28No4Data as Song),
    title: "Prelúdio Op. 28 nº 4",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Médio",
  },
  {
    ...(preludioData as Song),
    title: "Prelúdio de Chopin",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(preludio15Data as Song),
    title: "Prelúdio nº 15",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(preludio20Data as Song),
    title: "Prelúdio nº 20",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Médio",
  },
  {
    ...(preludio6Data as Song),
    title: "Prelúdio nº 6",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Médio",
  },
  {
    ...(preludio7Data as Song),
    title: "Prelúdio nº 7",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Fácil",
  },
  {
    ...(premiereArabesqueData as Song),
    title: "Primeira Arabesca",
    artist: "Claude Debussy",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_DEBUSSY,
    difficulty: "Difícil",
  },
  {
    ...(sonata2Data as Song),
    title: "Sonata nº 2 em Si Bemol Menor",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
  {
    ...(sonataFragmentData as Song),
    title: "Sonata em Dó Maior (Fragmento)",
    artist: "Wolfgang Amadeus Mozart",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_MOZART,
    difficulty: "Médio",
  },
  {
    ...(clairDeLuneData as Song),
    title: "Clair de Lune",
    artist: "Claude Debussy",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_DEBUSSY,
    difficulty: "Difícil",
  },
  {
    ...(seasonsAugustData as Song),
    title: "As Estações: Agosto",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Difícil",
  },
  {
    ...(seasonsFebruaryData as Song),
    title: "As Estações: Fevereiro",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Difícil",
  },
  {
    ...(seasonsJanuaryData as Song),
    title: "As Estações: Janeiro",
    artist: "Piotr Ilitch Tchaikovsky",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_TCHAIKOVSKY,
    difficulty: "Difícil",
  },
  {
    ...(troisEtudesData as Song),
    title: "Três Novos Estudos nº 1 em Fá Menor",
    artist: "Frédéric Chopin",
    category: "Clássicos",
    isPremium: true,
    coverUrl: COVER_CHOPIN,
    difficulty: "Difícil",
  },
];

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}
