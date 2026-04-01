const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

/**
 * Script de Automação PianoKids: MIDI to Song JSON
 * Esse script garante 100% de precisão "correcta" nas músicas,
 * pois extrai os tempos e durações reais de arquivos .mid.
 */

const MIDI_DIR = path.resolve(__dirname, "../public/midi");
const SONGS_DIR = path.resolve(__dirname, "../public/songs");

async function convertMidi() {
  if (!fs.existsSync(MIDI_DIR)) {
    console.error("❌ Erro: Pasta public/midi não encontrada!");
    return;
  }

  const files = fs.readdirSync(MIDI_DIR).filter((f) => f.toLowerCase().endsWith(".mid"));

  if (files.length === 0) {
    console.log("⚠️  Nenhum arquivo .mid encontrado em public/midi.");
    return;
  }

  for (const file of files) {
    console.log(`\n🎼 Processando: ${file}...`);
    const filePath = path.join(MIDI_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const midi = new Midi(buffer);

    const allNotes = [];
    
    // Iterar por todas as tracks do MIDI
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        allNotes.push({
          midi: note.midi,
          time: Number(note.time.toFixed(3)),
          duration: Number(note.duration.toFixed(3)),
          velocity: Number(note.velocity.toFixed(2)),
          // Heurística básica: Acima do Dó Central (60) = Mão Direita
          hand: note.midi >= 60 ? "right" : "left",
        });
      });
    });

    // Ordenar notas por tempo de início
    allNotes.sort((a, b) => a.time - b.time);

    const id = file.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, "-");
    const jsonOutput = {
      id: id,
      title: midi.name || id.charAt(0).toUpperCase() + id.slice(1).replace("-", " "),
      artist: "MIDI Source",
      difficulty: "Médio",
      bpm: Math.round(midi.header.tempos[0]?.bpm || 120),
      duration: Math.round(midi.duration),
      category: "Para Iniciantes",
      isPremium: true,
      coverUrl: "/images/covers/placeholder.png",
      notes: allNotes,
    };

    const outputPath = path.join(SONGS_DIR, `${id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`✅ Sucesso! Gerado: public/songs/${id}.json (${allNotes.length} notas)`);
    console.log(`ℹ️  Dica: Lembre-se de importar este JSON em seu src/lib/songs.ts`);
  }
}

convertMidi().catch((err) => {
  console.error("❌ Erro fatal no processamento:");
  console.error(err);
});
