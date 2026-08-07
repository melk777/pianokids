const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

const STEP_TO_SEMITONE = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseAttributes(source) {
  const attributes = {};
  const expression = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = expression.exec(source))) {
    attributes[match[1]] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return attributes;
}

function parseXml(source) {
  const root = { name: "#document", attributes: {}, children: [], text: "" };
  const stack = [root];
  const tokens = source.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<\/?[^>]+>|[^<]+/g) || [];

  for (const token of tokens) {
    if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<!DOCTYPE")) continue;
    if (token.startsWith("</")) {
      const closingName = token.slice(2, -1).trim();
      const node = stack.pop();
      if (!node || node.name !== closingName) {
        throw new Error(`XML malformado: fechamento </${closingName}> inesperado.`);
      }
      continue;
    }
    if (token.startsWith("<")) {
      const selfClosing = token.endsWith("/>");
      const contents = token.slice(1, selfClosing ? -2 : -1).trim();
      const separator = contents.search(/\s/);
      const name = separator === -1 ? contents : contents.slice(0, separator);
      const attributeSource = separator === -1 ? "" : contents.slice(separator + 1);
      const node = { name, attributes: parseAttributes(attributeSource), children: [], text: "" };
      stack[stack.length - 1].children.push(node);
      if (!selfClosing) stack.push(node);
      continue;
    }
    const text = decodeEntities(token.trim());
    if (text) stack[stack.length - 1].text += text;
  }

  if (stack.length !== 1) throw new Error(`XML malformado: elemento <${stack.at(-1).name}> nao foi fechado.`);
  return root.children[0];
}

function children(node, name) {
  return node?.children.filter((child) => child.name === name) || [];
}

function child(node, name) {
  return children(node, name)[0];
}

function textOf(node, name) {
  return child(node, name)?.text || "";
}

function numberOf(node, name, fallback = 0) {
  const value = Number(textOf(node, name));
  return Number.isFinite(value) ? value : fallback;
}

function pitchToMidi(noteNode) {
  const pitch = child(noteNode, "pitch");
  if (!pitch) return null;
  const step = textOf(pitch, "step");
  const octave = numberOf(pitch, "octave", NaN);
  const alter = numberOf(pitch, "alter", 0);
  if (!(step in STEP_TO_SEMITONE) || !Number.isFinite(octave)) return null;
  return (octave + 1) * 12 + STEP_TO_SEMITONE[step] + alter;
}

function parseMusicXml(score) {
  if (!score || score.name !== "score-partwise") throw new Error("A entrada deve ser uma partitura MusicXML score-partwise.");
  const part = child(score, "part");
  if (!part) throw new Error("A partitura MusicXML nao contem uma parte musical.");

  let divisions = 1;
  let beats = 4;
  let beatType = 4;
  let measureStartBeats = 0;
  const notes = [];
  const activeTies = new Map();

  for (const measure of children(part, "measure")) {
    let cursorDivisions = 0;
    let maximumCursorDivisions = 0;
    let previousNoteStartDivisions = 0;
    let previousVoice = "1";
    let previousStaff = 1;

    for (const event of measure.children) {
      if (event.name === "attributes") {
        const nextDivisions = numberOf(event, "divisions", divisions);
        if (nextDivisions > 0) divisions = nextDivisions;
        const time = child(event, "time");
        if (time) {
          beats = numberOf(time, "beats", beats);
          beatType = numberOf(time, "beat-type", beatType);
        }
        continue;
      }
      if (event.name === "backup") {
        cursorDivisions -= numberOf(event, "duration", 0);
        if (cursorDivisions < 0) {
          throw new Error(`Compasso ${measure.attributes.number}: backup ultrapassou o inicio do compasso.`);
        }
        continue;
      }
      if (event.name === "forward") {
        cursorDivisions += numberOf(event, "duration", 0);
        maximumCursorDivisions = Math.max(maximumCursorDivisions, cursorDivisions);
        continue;
      }
      if (event.name !== "note") continue;

      const durationDivisions = numberOf(event, "duration", 0);
      const isChord = Boolean(child(event, "chord"));
      const isGrace = Boolean(child(event, "grace"));
      const voice = textOf(event, "voice") || (isChord ? previousVoice : "1");
      const staff = numberOf(event, "staff", isChord ? previousStaff : 1);
      const startDivisions = isChord ? previousNoteStartDivisions : cursorDivisions;
      const midi = pitchToMidi(event);

      if (!child(event, "rest") && midi !== null && !isGrace && durationDivisions > 0) {
        const tieTypes = new Set(children(event, "tie").map((tie) => tie.attributes.type));
        const tieKey = `${staff}|${voice}|${midi}`;
        const startBeats = measureStartBeats + startDivisions / divisions;
        const durationBeats = durationDivisions / divisions;
        const activeTie = activeTies.get(tieKey);

        if (tieTypes.has("stop") && activeTie) {
          activeTie.durationBeats = startBeats + durationBeats - activeTie.startBeats;
          if (!tieTypes.has("start")) activeTies.delete(tieKey);
        } else {
          const parsedNote = { midi, startBeats, durationBeats, staff, voice };
          notes.push(parsedNote);
          if (tieTypes.has("start")) activeTies.set(tieKey, parsedNote);
        }
      }

      if (!isChord) {
        previousNoteStartDivisions = startDivisions;
        previousVoice = voice;
        previousStaff = staff;
        cursorDivisions += durationDivisions;
        maximumCursorDivisions = Math.max(maximumCursorDivisions, cursorDivisions);
      }
    }

    measureStartBeats += maximumCursorDivisions / divisions;
  }

  if (!notes.length) throw new Error("A partitura MusicXML nao produziu notas.");
  return { notes, timeSignature: [beats, beatType] };
}

function createMidi(parsed, bpm) {
  const midi = new Midi();
  midi.header.setTempo(bpm);
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: parsed.timeSignature,
    measures: 0,
  });
  const tracks = [midi.addTrack(), midi.addTrack()];
  tracks[0].name = "Right hand (MusicXML staff 1)";
  tracks[1].name = "Left hand (MusicXML staff 2+)";
  tracks.forEach((track) => {
    track.instrument.number = 0;
  });

  for (const note of parsed.notes) {
    const track = tracks[note.staff === 1 ? 0 : 1];
    track.addNote({
      midi: note.midi,
      ticks: Math.round(note.startBeats * midi.header.ppq),
      durationTicks: Math.max(1, Math.round(note.durationBeats * midi.header.ppq)),
      velocity: note.staff === 1 ? 0.72 : 0.64,
    });
  }

  return midi;
}

function musicXmlToMidiBuffer(source, bpm) {
  const parsed = parseMusicXml(parseXml(source));
  return Buffer.from(createMidi(parsed, bpm).toArray());
}

function writeMidi(parsed, outputPath, bpm) {
  const midi = createMidi(parsed, bpm);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(midi.toArray()));
  return midi.tracks.map((track) => ({
    name: track.name,
    notes: track.notes.length,
    range: [Math.min(...track.notes.map((note) => note.midi)), Math.max(...track.notes.map((note) => note.midi))],
  }));
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main() {
  const input = readArgument("--input");
  const output = readArgument("--output");
  const bpm = Number(readArgument("--bpm") || 120);
  if (!input || !output || !Number.isFinite(bpm) || bpm <= 0) {
    throw new Error("Uso: node scripts/musicxml-to-midi.js --input partitura.xml --output canonical.mid [--bpm 75]");
  }
  const parsed = parseMusicXml(parseXml(fs.readFileSync(path.resolve(input), "utf8")));
  const tracks = writeMidi(parsed, path.resolve(output), bpm);
  console.log(JSON.stringify({ input, output, bpm, timeSignature: parsed.timeSignature, tracks }, null, 2));
}

if (require.main === module) main();

module.exports = { createMidi, musicXmlToMidiBuffer, parseMusicXml, parseXml, writeMidi };
