const fs = require("fs");
const path = require("path");

// Read CSV file with UTF-8 encoding to handle Persian text
const csvPath = path.join(__dirname, "..", "عطرها  - Sheet1.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");

// Parse CSV manually (simple parser for this specific format)
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
const headers = lines[0].split(",").map((h) => h.trim());

// Find column indices
const nameEnIndex = headers.findIndex(
  (h) => h.includes("نام انگلیسی") || h.includes("name_en")
);
const brandIndex = headers.findIndex(
  (h) => h.includes("برند") || h.includes("brand")
);
const topNotesIndex = headers.findIndex(
  (h) => h.includes("نت اولیه") || h.includes("top")
);
const middleNotesIndex = headers.findIndex(
  (h) => h.includes("نت میانی") || h.includes("middle")
);
const baseNotesIndex = headers.findIndex(
  (h) => h.includes("نت پایانی") || h.includes("base")
);

console.log("📖 Parsing CSV file...");
console.log(
  `Found columns: NameEn=${nameEnIndex}, Brand=${brandIndex}, Top=${topNotesIndex}, Middle=${middleNotesIndex}, Base=${baseNotesIndex}`
);

// Extract all unique notes with layer tracking
const allNotes = new Set();
const notesByPerfume = [];
const noteLayerStats = {}; // Track which layer each note appears in
const noteBrandStats = {}; // Track which brands use each note

// Helper function to parse note strings
function parseNotes(noteString) {
  if (!noteString || noteString.trim().length === 0) return [];

  // Handle quoted strings (some notes are in quotes)
  let cleaned = noteString.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  // Split by both Persian comma (،) and regular comma
  const notes = cleaned
    .split(/[،,]/)
    .map((note) => note.trim())
    .filter((note) => note.length > 0);

  return notes;
}

// Helper function to track note layer statistics
function trackNoteLayer(note, layer) {
  if (!noteLayerStats[note]) {
    noteLayerStats[note] = { top: 0, middle: 0, base: 0, total: 0 };
  }
  noteLayerStats[note][layer]++;
  noteLayerStats[note].total++;
}

// Helper function to track note brand statistics
function trackNoteBrand(note, brand) {
  if (!brand || brand.trim().length === 0) return;
  if (!noteBrandStats[note]) {
    noteBrandStats[note] = {};
  }
  noteBrandStats[note][brand] = (noteBrandStats[note][brand] || 0) + 1;
}

// Process each perfume row
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];

  // Simple CSV parsing (handle quoted fields)
  const fields = [];
  let currentField = "";
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      // Only split on regular comma, not Persian comma (،)
      // Persian comma is part of the note text
      fields.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim()); // Add last field

  if (fields.length < 5) continue; // Skip invalid rows

  const perfumeName = fields[nameEnIndex] || fields[1] || fields[0]; // English name
  // Brand is at index 5 (after name_fa, name_en, top, middle, base)
  // Make sure we get the correct brand field
  let brand = "";
  if (brandIndex >= 0 && brandIndex < fields.length) {
    brand = (fields[brandIndex] || "").trim();
  } else if (fields.length > 5) {
    // Fallback: brand should be at index 5
    brand = (fields[5] || "").trim();
  }

  const topNotes = parseNotes(fields[topNotesIndex] || "");
  const middleNotes = parseNotes(fields[middleNotesIndex] || "");
  const baseNotes = parseNotes(fields[baseNotesIndex] || "");

  // Collect all notes and track layer and brand statistics
  topNotes.forEach((note) => {
    allNotes.add(note);
    trackNoteLayer(note, "top");
    trackNoteBrand(note, brand);
  });
  middleNotes.forEach((note) => {
    allNotes.add(note);
    trackNoteLayer(note, "middle");
    trackNoteBrand(note, brand);
  });
  baseNotes.forEach((note) => {
    allNotes.add(note);
    trackNoteLayer(note, "base");
    trackNoteBrand(note, brand);
  });

  notesByPerfume.push({
    name: perfumeName,
    brand: brand,
    top: topNotes,
    middle: middleNotes,
    base: baseNotes,
  });
}

// Convert Set to sorted array
const uniqueNotes = Array.from(allNotes).sort((a, b) =>
  a.localeCompare(b, "fa")
);

// Calculate primary layer for each note (where it appears most often)
const notesWithLayers = uniqueNotes.map((note) => {
  const stats = noteLayerStats[note];
  const topRatio = stats.top / stats.total;
  const middleRatio = stats.middle / stats.total;
  const baseRatio = stats.base / stats.total;

  // Determine primary layer
  let primaryLayer = "top";
  if (middleRatio > topRatio && middleRatio > baseRatio) {
    primaryLayer = "middle";
  } else if (baseRatio > topRatio && baseRatio > middleRatio) {
    primaryLayer = "base";
  } else if (topRatio === middleRatio && topRatio > baseRatio) {
    primaryLayer = "top"; // Default to top if tied
  } else if (baseRatio === middleRatio && baseRatio > topRatio) {
    primaryLayer = "base";
  }

  // Get brands that use this note
  const brandStats = noteBrandStats[note] || {};
  const brands = Object.keys(brandStats).sort();
  const brandCounts = brands.map((brand) => ({
    brand,
    count: brandStats[brand],
  }));

  return {
    note,
    stats: {
      top: stats.top,
      middle: stats.middle,
      base: stats.base,
      total: stats.total,
      topRatio: Math.round(topRatio * 100) / 100,
      middleRatio: Math.round(middleRatio * 100) / 100,
      baseRatio: Math.round(baseRatio * 100) / 100,
      primaryLayer,
    },
    brands: brands,
    brandCounts: brandCounts,
    totalBrands: brands.length,
  };
});

console.log(`\n✅ Extraction complete!`);
console.log(`📊 Total perfumes processed: ${notesByPerfume.length}`);
console.log(`📝 Total unique notes found: ${uniqueNotes.length}`);

// Count notes by primary layer
const layerCounts = {
  top: notesWithLayers.filter((n) => n.stats.primaryLayer === "top").length,
  middle: notesWithLayers.filter((n) => n.stats.primaryLayer === "middle")
    .length,
  base: notesWithLayers.filter((n) => n.stats.primaryLayer === "base").length,
};
console.log(
  `📈 Notes by primary layer: Top=${layerCounts.top}, Middle=${layerCounts.middle}, Base=${layerCounts.base}`
);

// Save raw notes with layer information
const outputPath = path.join(__dirname, "learned-notes-raw.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      totalNotes: uniqueNotes.length,
      totalPerfumes: notesByPerfume.length,
      uniqueNotes: uniqueNotes,
      notesByPerfume: notesByPerfume,
      notesWithLayers: notesWithLayers,
      layerCounts: layerCounts,
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`💾 Saved raw notes to: ${outputPath}`);
console.log(`\n📋 Sample notes (first 20):`);
uniqueNotes.slice(0, 20).forEach((note, i) => {
  console.log(`  ${i + 1}. ${note}`);
});
