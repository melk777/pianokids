const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

/**
 * Script de Automação PianoKids: MIDI to Song JSON (Multi-Versão)
 * Agora suporta pares de arquivos (ex: nome-1.mid e nome-2.mid)
 * para gerar versões de 1 mão e 2 mãos no mesmo JSON.
 */

const MIDI_DIR = path.resolve(__dirname, "../public/midi");
const SONGS_DIR = path.resolve(__dirname, "../public/songs");

async function parseMidiFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  const midi = new Midi(buffer);
  const notes = [];
  
  midi.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      notes.push({
        midi: note.midi,
        time: Number(note.time.toFixed(3)),
        duration: Number(note.duration.toFixed(3)),
        velocity: Number(note.velocity.toFixed(2)),
        // Heurística básica: Acima do Dó Central (60) = Mão Direita
        hand: note.midi >= 60 ? "right" : "left",
      });
    });
  });

  notes.sort((a, b) => a.time - b.time);
  
  return {
    notes,
    bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
    duration: Math.round(midi.duration),
    title: midi.name
  };
}

async function convertMidi() {
  if (!fs.existsSync(MIDI_DIR)) {
    console.error("❌ Erro: Pasta public/midi não encontrada!");
    return;
  }

  const allFiles = fs.readdirSync(MIDI_DIR).filter((f) => f.toLowerCase().endsWith(".mid"));

  if (allFiles.length === 0) {
    console.log("⚠️  Nenhum arquivo .mid encontrado.");
    return;
  }

  // Agrupar arquivos pelo nome base (removendo sufixos -1 ou -2)
  const groups = {};
  allFiles.forEach((file) => {
    // Remove o sufixo de versão se existir
    const base = file.replace(/[-_][12]\.mid$/i, "").replace(/\.mid$/i, "").toLowerCase();
    if (!groups[base]) groups[base] = [];
    groups[base].push(file);
  });

  for (const [base, groupFiles] of Object.entries(groups)) {
    console.log(`\n🎼 Processando música: ${base}...`);

    let notes1Hand = null;
    let notes2Hands = null;
    let metaData = null;

    for (const file of groupFiles) {
      const isV1 = /[-_]1\.mid$/i.test(file);
      const isV2 = /[-_]2\.mid$/i.test(file);
      
      const filePath = path.join(MIDI_DIR, file);
      const data = await parseMidiFile(filePath);

      if (isV1) {
        notes1Hand = data.notes;
        console.log(`   - Versão 1 Mão detectada (${data.notes.length} notas)`);
      }
      if (isV2) {
        notes2Hands = data.notes;
        console.log(`   - Versão 2 Mãos detectada (${data.notes.length} notas)`);
      }
      
      // Usa o metadado da versão 2 como preferencial, ou qualquer uma se só houver uma
      if (!metaData || isV2) {
        metaData = data;
      }
    }

    const jsonOutput = {
      id: base,
      title: metaData.title || base.charAt(0).toUpperCase() + base.slice(1).replace(/-/g, " "),
      artist: "MIDI Source",
      difficulty: groupFiles.length > 1 ? "Médio" : "Fácil",
      bpm: metaData.bpm,
      duration: metaData.duration,
      category: "Infantis",
      isPremium: true,
      coverUrl: "/images/covers/placeholder.png",
      notes: notes2Hands || notes1Hand || [], // Fallback para compatibilidade
      notes1Hand: notes1Hand,
      notes2Hands: notes2Hands
    };

    const outputPath = path.join(SONGS_DIR, `${base}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`✅ Sucesso! JSON gerado em public/songs/${base}.json`);
  }
}

convertMidi().catch(console.error);
