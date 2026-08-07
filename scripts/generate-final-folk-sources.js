const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");
const { notationJsonToMidiBuffer } = require("./notation-json-to-midi");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(ROOT_DIR, "music-sources", "rebuild", "wave-2");

const CHORDS = {
  C: [36, 43, 48, 52], Cm: [36, 43, 48, 51], C7: [36, 43, 46, 52],
  D: [38, 45, 50, 54], Dm: [38, 45, 50, 53], D7: [38, 45, 48, 54],
  E7: [40, 47, 50, 56], Eb: [39, 46, 51, 55],
  F: [41, 48, 53, 57], Fm: [41, 48, 53, 56],
  G: [43, 50, 55, 59], Gm: [43, 50, 55, 58], G7: [43, 47, 50, 53],
  A7: [45, 52, 55, 61], Am: [45, 52, 57, 60],
  Ab: [44, 51, 56, 60], Bb: [46, 53, 58, 62], Bb7: [46, 53, 56, 62],
};

function round(value, quantum = 0.25) {
  return Number((Math.round(value / quantum) * quantum).toFixed(3));
}

function hash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function clipMelody(config) {
  const midi = new Midi(fs.readFileSync(path.join(ROOT_DIR, "public", "midi", config.file)));
  const source = midi.tracks[config.track].notes
    .filter((note) => note.ticks / midi.header.ppq >= config.startBeat)
    .filter((note) => note.ticks / midi.header.ppq < config.endBeat)
    .filter((note) => !config.minMidi || note.midi >= config.minMidi)
    .filter((note) => !config.maxMidi || note.midi <= config.maxMidi)
    .map((note) => ({
      midi: note.midi + (config.transpose || 0),
      beat: note.ticks / midi.header.ppq,
      duration: note.durationTicks / midi.header.ppq,
    }));
  if (!source.length) throw new Error(`${config.file}: recorte melodico vazio.`);

  const firstBeat = Math.min(...source.map((note) => note.beat));
  const groups = new Map();
  for (const note of source) {
    const beat = round(note.beat - firstBeat, config.quantum);
    const notes = groups.get(beat) || [];
    notes.push({ ...note, beat });
    groups.set(beat, notes);
  }

  const selected = [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, notes]) => [...notes].sort((left, right) =>
      config.pick === "lowest" ? left.midi - right.midi : right.midi - left.midi,
    )[0]);

  return selected.map((note, index) => {
    const next = selected[index + 1];
    const available = next ? next.beat - note.beat : round(note.duration, config.quantum);
    return {
      midi: note.midi,
      beat: note.beat,
      duration: Math.max(config.quantum, Math.min(round(note.duration, config.quantum), available)),
    };
  });
}

function sequenceEvents(sequence) {
  let beat = 0;
  return sequence.map(([midi, duration]) => {
    const event = { midi, beat, duration };
    beat += duration;
    return event;
  });
}

function harmonyEvents(chordNames, repeatLengthBeats, measureBeats) {
  const events = [];
  for (let beat = 0, index = 0; beat < repeatLengthBeats; beat += measureBeats, index += 1) {
    const name = chordNames[index % chordNames.length];
    const midis = CHORDS[name];
    if (!midis) throw new Error(`Acorde editorial desconhecido: ${name}.`);
    events.push({ midis, beat, duration: Math.min(measureBeats, repeatLengthBeats - beat) });
  }
  return events;
}

const definitions = [
  {
    id: "carneirinho-carneirao", title: "Carneirinho, Carneirao", composer: "Tradicional brasileiro",
    bpm: 100, timeSignature: [4, 4], key: "F major", repeatCount: 2, repeatLengthBeats: 32,
    clip: { file: "carneirinho_carneirao.mid", track: 0, startBeat: 0, endBeat: 31.5, quantum: 0.5, pick: "highest" },
    chords: ["F", "C7", "F", "Bb", "F", "C7", "F", "C7"],
    source: "Independent Pianify notation of the public-domain Brazilian circle-song melody; checked against the UNESP public-domain staff and the CNFCP catalogue record.",
  },
  {
    id: "oh-que-belas-laranjas", title: "Oh! Que Belas Laranjas", composer: "Tradicional brasileiro",
    bpm: 112, timeSignature: [4, 4], key: "A-flat major", repeatCount: 2, repeatLengthBeats: 32,
    clip: { file: "oh_que_belas_laranjas.mid", track: 0, startBeat: 0, endBeat: 32, quantum: 0.25, pick: "lowest" },
    chords: ["Ab", "Eb", "Ab", "Eb", "Ab", "Eb", "Ab", "Eb"],
    source: "Independent Pianify notation of the traditional melody known as Oh! que bela laranja madura; official CNFCP catalogue status checked as public domain.",
  },
  {
    id: "onde-esta-a-margarida", title: "Onde Esta a Margarida?", composer: "Tradicional brasileiro",
    bpm: 104, timeSignature: [4, 4], key: "G major", repeatCount: 4, repeatLengthBeats: 18,
    clip: { file: "onde_esta_a_margarida.mid", track: 6, startBeat: 20.5, endBeat: 38.5, quantum: 0.5, pick: "highest" },
    chords: ["G", "D7", "G", "D7", "G"], measureBeats: 4,
    source: "Independent Pianify notation of one complete traditional call-and-response stanza; the repeating stanza form and public-domain status were checked against CNFCP and educational notation.",
  },
  {
    id: "pai-francisco", title: "Pai Francisco", composer: "Tradicional brasileiro",
    bpm: 108, timeSignature: [4, 4], key: "C major", repeatCount: 2, repeatLengthBeats: 32,
    melody: sequenceEvents([
      [60,.5],[64,.5],[67,.5],[67,.5],[67,.5],[69,.5],[67,.5],[72,1],
      [60,.5],[64,.5],[67,.5],[67,.5],[65,.5],[64,.5],[62,1],
      [67,.5],[71,.5],[69,.5],[67,.5],[65,.5],[64,.5],[62,.5],[69,.5],[67,1],
      [67,.5],[60,.5],[64,.5],[67,.5],[67,.5],[65,.5],[64,.5],[62,.5],[60,1],
      [67,.5],[69,.5],[67,.5],[65,1],[62,.5],[62,.5],[67,.5],[65,.5],[64,.5],[64,1],
      [60,.5],[65,.5],[64,.5],[64,.5],[62,.5],[62,.5],[67,.5],[67,.5],[60,1.5],[67,.5],
    ]),
    chords: ["C", "G7", "C", "G7", "C", "F", "G7"],
    source: "Independent Pianify notation of the public-domain circle song, following the widely taught Brazilian melodic sequence and complete dance refrain.",
  },
  {
    id: "passarinho-da-lagoa", title: "Passarinho da Lagoa", composer: "Tradicional do Rio Grande do Norte",
    bpm: 104, timeSignature: [4, 4], key: "F major", repeatCount: 2, repeatLengthBeats: 17,
    clip: { file: "passarinho_da_lagoa.mid", track: 0, startBeat: 0.2, endBeat: 17, quantum: 0.25, pick: "highest" },
    chords: ["F", "C7", "Bb", "F", "C7"],
    source: "Independent Pianify notation of the traditional Rio Grande do Norte children's round documented by Dulce Caldas in 1947 and Verissimo de Melo in 1953.",
  },
  {
    id: "pezinho", title: "Pezinho", composer: "Tradicional sul-brasileiro",
    bpm: 116, timeSignature: [4, 4], key: "G major", repeatCount: 2, repeatLengthBeats: 32,
    clip: { file: "pezinho.mid", track: 1, startBeat: 0.4, endBeat: 31, quantum: 0.5, pick: "lowest" },
    chords: ["G", "D7", "G", "D7", "G", "D7", "G", "D7"],
    source: "Independent Pianify notation of the public-domain traditional dance song Bota aqui o seu pezinho; checked against Brazilian educational references.",
  },
  {
    id: "pirulito-que-bate-bate", title: "Pirulito que Bate Bate", composer: "Tradicional brasileiro",
    bpm: 108, timeSignature: [4, 4], key: "C major", repeatCount: 2, repeatLengthBeats: 16,
    clip: { file: "pirulito_que_bate_bate.mid", track: 0, startBeat: 0.4, endBeat: 16.2, quantum: 0.25, pick: "highest" },
    chords: ["C", "G7", "F", "G7"],
    source: "Independent Pianify notation of the traditional public-domain melody; public-domain status checked against the Sao Paulo state curriculum material.",
  },
  {
    id: "samba-lele", title: "Samba Lele", composer: "Tradicional brasileiro",
    bpm: 116, timeSignature: [4, 4], key: "D major", repeatCount: 2, repeatLengthBeats: 32,
    clip: { file: "samba_lele.mid", track: 1, startBeat: 40, endBeat: 72, quantum: 0.5, pick: "highest" },
    chords: ["D", "A7", "D", "A7", "D", "A7", "D", "A7"],
    source: "Independent Pianify notation of the public-domain Brazilian folk melody; form and harmony cross-checked against reviewed educational references.",
  },
  {
    id: "se-essa-rua-fosse-minha", title: "Se Essa Rua Fosse Minha", composer: "Tradicional luso-brasileiro",
    bpm: 92, timeSignature: [4, 4], key: "C minor", repeatCount: 3, repeatLengthBeats: 32,
    clip: { file: "se_essa_rua_fosse_minha.mid", track: 4, startBeat: 22.9, endBeat: 54, quantum: 0.5, pick: "highest" },
    chords: ["Cm", "G7", "Cm", "Ab", "Eb", "Bb7", "Cm", "G7"],
    source: "Independent Pianify notation of the traditional minor-mode melody, whose lyrics are documented at least since 1884; public-domain status checked against municipal educational material.",
  },
  {
    id: "tutu-maramba", title: "Tutu Maramba", composer: "Tradicional brasileiro",
    bpm: 96, timeSignature: [4, 4], key: "G major", repeatCount: 2, repeatLengthBeats: 36,
    clip: { file: "tutu_maramba.mid", track: 0, startBeat: 0, endBeat: 32.5, quantum: 0.5, pick: "highest" },
    chords: ["G", "D7", "G", "C", "G", "D7", "G", "D7"],
    source: "Independent Pianify notation of the traditional Brazilian lullaby collected by Elsie Houston in 1930; the historical edition is public domain.",
  },
  {
    id: "pintinho-amarelinho", title: "Meu Pintinho Amarelinho", composer: "Tradicional brasileiro",
    bpm: 112, timeSignature: [4, 4], key: "C major", repeatCount: 1, repeatLengthBeats: 64,
    clip: { file: "Meu_pintinho_amarelinho.mid", track: 0, startBeat: 0, endBeat: 64.1, quantum: 0.5, pick: "highest" },
    chords: ["C", "G7", "C", "G7", "F", "C", "G7", "C"],
    source: "Independent Pianify notation of the traditional melody; public-domain status cross-checked against CNFCP catalogue records and a Brazilian municipal cultural press kit.",
  },
  {
    id: "parabens-pra-voce", title: "Happy Birthday / Parabens (instrumental)", composer: "Mildred J. Hill (melody)",
    bpm: 96, timeSignature: [3, 4], key: "F major", repeatCount: 1, repeatLengthBeats: 24,
    melody: sequenceEvents([
      [60,.5],[60,.5],[62,1],[60,1],[65,1],[64,2],
      [60,.5],[60,.5],[62,1],[60,1],[67,1],[65,2],
      [60,.5],[60,.5],[72,1],[69,1],[65,1],[64,1],[62,1],
      [70,.5],[70,.5],[69,1],[65,1],[67,1],[65,2],
    ]),
    chords: ["F", "C7", "F", "Bb", "F", "C7", "F", "C7"], measureBeats: 3,
    source: "Instrumental melody only, independently notated from Good Morning to All in Song Stories for the Kindergarten (1893); no Portuguese lyrics or modern arrangement are bundled.",
  },
  {
    id: "bella-ciao-lacasadepapel", title: "Bella Ciao", composer: "Traditional Italian folk song",
    bpm: 92, timeSignature: [4, 4], key: "D minor", repeatCount: 2, repeatLengthBeats: 32,
    melody: [
      {midi:57,beat:0,duration:.5},{midi:62,beat:.5,duration:.5},{midi:64,beat:1,duration:.5},
      {midi:65,beat:1.5,duration:.5},{midi:62,beat:2,duration:2},
      {midi:57,beat:4,duration:.5},{midi:62,beat:4.5,duration:.5},{midi:64,beat:5,duration:.5},
      {midi:65,beat:5.5,duration:.5},{midi:62,beat:6,duration:2},
      {midi:57,beat:8,duration:.5},{midi:62,beat:8.5,duration:.5},{midi:64,beat:9,duration:.5},
      {midi:65,beat:9.5,duration:1},{midi:64,beat:10.5,duration:.5},{midi:62,beat:11,duration:.5},
      {midi:65,beat:11.5,duration:1},{midi:64,beat:12.5,duration:.5},{midi:62,beat:13,duration:.5},
      {midi:69,beat:13.5,duration:1},{midi:69,beat:14.5,duration:1},{midi:69,beat:15.5,duration:.5},
      {midi:69,beat:16,duration:.5},{midi:67,beat:16.5,duration:.5},{midi:69,beat:17,duration:.5},
      {midi:70,beat:17.5,duration:.5},{midi:70,beat:18,duration:2},{midi:70,beat:20,duration:.5},
      {midi:69,beat:20.5,duration:.5},{midi:67,beat:21,duration:.5},{midi:70,beat:21.5,duration:.5},
      {midi:69,beat:22,duration:2},{midi:69,beat:24,duration:.5},{midi:67,beat:24.5,duration:.5},
      {midi:65,beat:25,duration:.5},{midi:64,beat:25.5,duration:1},{midi:69,beat:26.5,duration:1},
      {midi:65,beat:27.5,duration:1},{midi:64,beat:28.5,duration:1},{midi:62,beat:29.5,duration:2.5},
    ],
    chords: ["Dm", "Dm", "Dm", "A7", "Dm", "Gm", "A7", "Dm"],
    source: "Independent Pianify notation of the traditional Italian folk melody from Manuela Goessnitzer's CC0 LilyPond edition; no television-series arrangement or branding is used.",
  },
];

function main() {
  const manifest = [];
  for (const definition of definitions) {
    const melody = definition.melody || clipMelody(definition.clip);
    const melodyEnd = Math.max(...melody.map((event) => event.beat + event.duration));
    if (definition.repeatCount > 1 && melodyEnd > definition.repeatLengthBeats) {
      throw new Error(`${definition.id}: a melodia termina em ${melodyEnd}, depois do inicio da repeticao em ${definition.repeatLengthBeats}.`);
    }
    const measureBeats = definition.measureBeats || definition.timeSignature[0];
    const notation = {
      schemaVersion: 1,
      id: definition.id,
      title: definition.title,
      composer: definition.composer,
      bpm: definition.bpm,
      timeSignature: definition.timeSignature,
      key: definition.key,
      gate: 0.9,
      source: {
        work: definition.title,
        transcription: definition.source,
        harmony: "Original Pianify editorial piano harmonization v1, separated from the source melody.",
      },
      tracks: [
        {
          name: "Right hand - source melody",
          role: "source-melody",
          velocity: 0.78,
          repeatCount: definition.repeatCount,
          repeatLengthBeats: definition.repeatLengthBeats,
          events: melody,
        },
        {
          name: "Left hand - Pianify editorial harmony v1",
          role: "editorial-harmonization",
          velocity: 0.5,
          repeatCount: definition.repeatCount,
          repeatLengthBeats: definition.repeatLengthBeats,
          events: harmonyEvents(definition.chords, definition.repeatLengthBeats, measureBeats),
        },
      ],
    };

    const directory = path.join(OUTPUT_ROOT, definition.id);
    const notationPath = path.join(directory, `${definition.id}.notation.json`);
    const midiPath = path.join(directory, `${definition.id}.canonical.mid`);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(notationPath, `${JSON.stringify(notation, null, 2)}\n`, "utf8");
    fs.writeFileSync(midiPath, notationJsonToMidiBuffer(notation));
    manifest.push({
      id: definition.id,
      notationFile: path.relative(path.join(ROOT_DIR, "music-sources", "rebuild"), notationPath).replaceAll("\\", "/"),
      midiFile: path.relative(path.join(ROOT_DIR, "music-sources", "rebuild"), midiPath).replaceAll("\\", "/"),
      notationSha256: hash(notationPath),
      midiSha256: hash(midiPath),
      melodyNotes: melody.length * definition.repeatCount,
    });
  }
  const manifestPath = path.join(OUTPUT_ROOT, "final-folk-batch-manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

main();
