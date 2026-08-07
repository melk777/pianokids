const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

function assertPositiveNumber(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} deve ser um numero positivo.`);
}

function normalizeEvent(event, trackIndex, eventIndex) {
  const label = `Faixa ${trackIndex}, evento ${eventIndex}`;
  assertPositiveNumber(event.duration, `${label}: duration`);
  if (!Number.isFinite(event.beat) || event.beat < 0) throw new Error(`${label}: beat invalido.`);
  const midis = Array.isArray(event.midis) ? event.midis : [event.midi];
  if (!midis.length || midis.some((midi) => !Number.isInteger(midi) || midi < 0 || midi > 127)) {
    throw new Error(`${label}: altura MIDI invalida.`);
  }
  return { ...event, midis };
}

function parseNotation(source) {
  const notation = typeof source === "string" ? JSON.parse(source) : source;
  if (notation.schemaVersion !== 1) throw new Error("A notacao JSON deve usar schemaVersion 1.");
  assertPositiveNumber(notation.bpm, "bpm");
  if (
    !Array.isArray(notation.timeSignature) ||
    notation.timeSignature.length !== 2 ||
    notation.timeSignature.some((value) => !Number.isInteger(value) || value <= 0)
  ) {
    throw new Error("timeSignature deve conter dois inteiros positivos.");
  }
  if (!Array.isArray(notation.tracks) || notation.tracks.length < 2) {
    throw new Error("A notacao deve conter pelo menos duas faixas.");
  }

  const tracks = notation.tracks.map((track, trackIndex) => {
    if (!Array.isArray(track.events) || !track.events.length) {
      throw new Error(`Faixa ${trackIndex}: events ausente ou vazio.`);
    }
    const repeatCount = track.repeatCount ?? 1;
    const repeatLengthBeats = track.repeatLengthBeats ?? 0;
    if (!Number.isInteger(repeatCount) || repeatCount < 1) throw new Error(`Faixa ${trackIndex}: repeatCount invalido.`);
    if (repeatCount > 1) assertPositiveNumber(repeatLengthBeats, `Faixa ${trackIndex}: repeatLengthBeats`);
    return {
      ...track,
      repeatCount,
      repeatLengthBeats,
      events: track.events.map((event, eventIndex) => normalizeEvent(event, trackIndex, eventIndex)),
    };
  });

  return { ...notation, tracks };
}

function createMidi(notation) {
  const midi = new Midi();
  midi.name = notation.title;
  midi.header.setTempo(notation.bpm);
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: notation.timeSignature,
    measures: 0,
  });

  notation.tracks.forEach((sourceTrack) => {
    const track = midi.addTrack();
    track.name = sourceTrack.name;
    track.instrument.number = 0;
    for (let repeatIndex = 0; repeatIndex < sourceTrack.repeatCount; repeatIndex += 1) {
      const repeatOffset = repeatIndex * sourceTrack.repeatLengthBeats;
      for (const event of sourceTrack.events) {
        const gate = event.gate ?? sourceTrack.gate ?? notation.gate ?? 0.92;
        assertPositiveNumber(gate, `${sourceTrack.name}: gate`);
        for (const pitch of event.midis) {
          track.addNote({
            midi: pitch,
            ticks: Math.round((event.beat + repeatOffset) * midi.header.ppq),
            durationTicks: Math.max(1, Math.round(event.duration * gate * midi.header.ppq)),
            velocity: event.velocity ?? sourceTrack.velocity ?? 0.68,
          });
        }
      }
    }
  });

  return midi;
}

function notationJsonToMidiBuffer(source) {
  return Buffer.from(createMidi(parseNotation(source)).toArray());
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main() {
  const input = readArgument("--input");
  const output = readArgument("--output");
  if (!input || !output) {
    throw new Error("Uso: node scripts/notation-json-to-midi.js --input fonte.json --output canonical.mid");
  }
  const source = fs.readFileSync(path.resolve(input), "utf8");
  const notation = parseNotation(source);
  const midi = createMidi(notation);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(path.resolve(output), Buffer.from(midi.toArray()));
  console.log(JSON.stringify({
    input,
    output,
    bpm: notation.bpm,
    timeSignature: notation.timeSignature,
    tracks: midi.tracks.map((track) => ({
      name: track.name,
      notes: track.notes.length,
      range: [Math.min(...track.notes.map((note) => note.midi)), Math.max(...track.notes.map((note) => note.midi))],
    })),
  }, null, 2));
}

if (require.main === module) main();

module.exports = { createMidi, notationJsonToMidiBuffer, parseNotation };
