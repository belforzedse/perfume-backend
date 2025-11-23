const fs = require("fs");
const path = require("path");

// Read translation mapping
const translationPath = path.join(__dirname, "persian-to-english-notes.json");
const translationMap = JSON.parse(fs.readFileSync(translationPath, "utf-8"));

// Read extracted notes with layers
const rawNotesPath = path.join(__dirname, "learned-notes-raw.json");
const rawData = JSON.parse(fs.readFileSync(rawNotesPath, "utf-8"));

console.log("📖 Translating Persian notes to English...");
console.log(`Found ${rawData.notesWithLayers.length} notes to translate`);

// Helper function to normalize Persian text
function normalizePersian(text) {
  return text.trim().replace(/\s+/g, " ");
}

// Translate notes with layer and brand information
const translatedNotes = rawData.notesWithLayers.map((item) => {
  const persianNote = normalizePersian(item.note);
  const englishNote = translationMap[persianNote];
  
  return {
    persian: persianNote,
    english: englishNote || persianNote, // Fallback to Persian if not translated
    isTranslated: englishNote !== null && englishNote !== undefined,
    stats: item.stats, // Preserve layer statistics
    brands: item.brands || [], // Preserve brand information
    brandCounts: item.brandCounts || [], // Preserve brand counts
    totalBrands: item.totalBrands || 0, // Total number of brands using this note
  };
});

// Count statistics
const translated = translatedNotes.filter((n) => n.isTranslated).length;
const untranslated = translatedNotes.filter((n) => !n.isTranslated).length;

console.log(`\n✅ Translation complete!`);
console.log(`📊 Translated: ${translated}`);
console.log(`⚠️  Untranslated: ${untranslated}`);

// Group by primary layer
const byLayer = {
  top: translatedNotes.filter((n) => n.stats.primaryLayer === "top"),
  middle: translatedNotes.filter((n) => n.stats.primaryLayer === "middle"),
  base: translatedNotes.filter((n) => n.stats.primaryLayer === "base"),
};

console.log(`\n📈 Notes by layer:`);
console.log(`  Top: ${byLayer.top.length}`);
console.log(`  Middle: ${byLayer.middle.length}`);
console.log(`  Base: ${byLayer.base.length}`);

// Save translated notes
const outputPath = path.join(__dirname, "learned-notes-translated.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      totalNotes: translatedNotes.length,
      translated: translated,
      untranslated: untranslated,
      notes: translatedNotes,
      byLayer: {
        top: byLayer.top.map((n) => ({
          persian: n.persian,
          english: n.english,
          stats: n.stats,
        })),
        middle: byLayer.middle.map((n) => ({
          persian: n.persian,
          english: n.english,
          stats: n.stats,
        })),
        base: byLayer.base.map((n) => ({
          persian: n.persian,
          english: n.english,
          stats: n.stats,
        })),
      },
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`💾 Saved translated notes to: ${outputPath}`);

// Show sample translations
console.log(`\n📋 Sample translations (first 10):`);
translatedNotes.slice(0, 10).forEach((note, i) => {
  const status = note.isTranslated ? "✅" : "⚠️";
  console.log(`  ${i + 1}. ${status} ${note.persian} → ${note.english}`);
});

if (untranslated > 0) {
  console.log(`\n⚠️  Untranslated notes (first 10):`);
  translatedNotes
    .filter((n) => !n.isTranslated)
    .slice(0, 10)
    .forEach((note, i) => {
      console.log(`  ${i + 1}. ${note.persian}`);
    });
}
